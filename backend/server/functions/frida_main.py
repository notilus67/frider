# _*_ coding:utf-8 _*_
import frida
import json
import time
import threading
from server.functions import utils

import requests
import urllib
import multiprocessing
from http.server import HTTPServer, BaseHTTPRequestHandler 

BURP_HOST="127.0.0.1"
BURP_PORT=8080
SERVER_HOST="127.0.0.1"
SERVER_PORT=17042
SERVER_PROCESS=None

# Plan A
api = object()  # frida script exports
packageName = ''    # current injected package name
consumer = object()
script = object() # frida script object

# intercept by burp
class FridaProxy(BaseHTTPRequestHandler):
    def do_FRIDA(self):
        request_headers = self.headers
        content_length = request_headers.get('content-length')
        length = int(content_length) if content_length else 0
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        data = self.rfile.read(length)
        self.wfile.write(data)

def start():
    server = HTTPServer((SERVER_HOST, SERVER_PORT), FridaProxy)
    print("[OK] Frida proxy server on ::%d started !" %SERVER_PORT)
    server.serve_forever()

# get USB device, return frida object
def get_usb_device():
    dManager = frida.get_device_manager()
    changed = threading.Event()
    def on_changed():
        changed.set()
    dManager.on('changed', on_changed)

    device = None
    while device is None:
        devices = [dev for dev in dManager.enumerate_devices() if dev.type == 'usb']
        if len(devices) == 0:
            print('Waiting for usb device...')
            changed.wait()
            time.sleep(2)
        else:
            device = devices[0]

    dManager.off('changed', on_changed)
    return device

def frida_receive(message, data):
    if message['type'] == 'send':
        if(message['payload'][:9] == 'Frider:::'):
            packet = json.loads(message['payload'][9:])
            if (packet['cmd'] == 'proxy'): # intercept by burp
                api = packet['data'][0]
                message = json.dumps(packet['data'][1])
                # print(message)
                req = requests.request('FRIDA', "http://%s:%d/%s" % (SERVER_HOST, SERVER_PORT, api),data=message,proxies={'http':'http://%s:%d' % (BURP_HOST, BURP_PORT)})
                global script
                script.post({ 'type': 'burp', 'data': urllib.request.unquote(req.content.decode("utf-8"))})
            else:
                global consumer # get consumer object
                ChatConsumer.websocket_send(consumer, packet)
        else:
            print(message['stack'])

def frida_load_script(scriptName, package):
    global script
    scriptDir = './server/functions/frida_scripts/'
    try: 
        scriptPath = scriptDir + scriptName
        with open(scriptPath, 'r', encoding='utf-8') as f:
            scriptCode = f.read()
        device = get_usb_device()
        pid = device.spawn([package])
        session = device.attach(pid)
        script = session.create_script(scriptCode)
        script.on("message", frida_receive)  # receive messages
        script.load()
        api = script.exports
        device.resume(pid)
        time.sleep(1)
    except Exception as ex:
        return ex
    return api

def _injectApp(package):
    scriptName = 'fridaAPI.js'
    res = frida_load_script(scriptName, package)
    print(str(res))
    #if (isinstance(res, object)): # 待测试 
    if(type(res).__name__ == 'ScriptExports'):
        global api, packageName
        api = res
        packageName = package
        return {"errCode": 0 }
    else:
        return {"errCode": 1, "errMsg": str(res) } 

def _enumJavaClasses():
    global api
    if( api.is_java_available == False ): # check Java VM
        return {"errCode": 2, "errMsg": "The current process doesn't have a Java VM loaded."}
    JavaClassNames = api.enumerate_classes()
    JavaClasses = list()
    key = 1
    for JavaClassName in JavaClassNames:
        JavaClass = {
            'key': str(key),
            'class': JavaClassName,
        }
        JavaClasses.append(JavaClass)
        key = key + 1
    return { "errCode": 0, "result": JavaClasses }

def _enumJavaMethods(query):
    global api
    if( api.is_java_available == False ): # check Java VM
        return {"errCode": 2, "errMsg": "The current process doesn't have a Java VM loaded."}
    JavaMethods = api.enumerate_methods(query)
    return { "errCode": 0, "result": JavaMethods }

def _enumNativeModules():
    global api, packageName
    appOnly = []
    result = []
    NativeModules = api.enumerate_modules()
    key = 1
    for NativeModule in NativeModules: # pick out inside-app libraries
        NativeModule['key'] = str(key)
        if packageName in NativeModule["path"]:
            appOnly.append(NativeModule)
        key = key + 1
    result = {
        'appOnly': appOnly,
        'all': NativeModules,
    }
    return { "errCode": 0, "result": result } 

def _enumNativeExports(module):
    global api
    NativeExports = api.enumerate_exports(module)
    variables = []
    functions = []
    result = []
    key = 1
    for NativeExport in NativeExports:
        NativeExport['key'] = str(key)
        NativeExport['module'] = module # save module name
        if(NativeExport['type'] == "variable"):
            variables.append(NativeExport)
        elif(NativeExport['type'] == "function"):
            functions.append(NativeExport)
        else:
            continue
        key = key + 1
    result = {
        'variables': variables,
        'functions': functions,
    }
    return { "errCode": 0, "result": result } 

# trace by list
def _traceList(listString):
    global api
    listJSON = json.loads(listString)
    if ('java' in listJSON):
        if( api.is_java_available == False ): # check Java VM
            return {"errCode": 2, "errMsg": "The current process doesn't have a Java VM loaded."}
        javaMethods = listJSON['java']
        if (len(javaMethods) > 0):
            for javaMethod in listJSON['java']:
                print(javaMethod)
                if (listJSON['intercept'] == False):
                    if (javaMethod['parse']):   # TODO (planned) using Gson/FastJson/Jackson to parse java object
                        api.trace_method_with_parse(javaMethod['class'], javaMethod['method'])
                    else:
                        api.trace_method(javaMethod['class'], javaMethod['method'])
                else:
                    global SERVER_PROCESS
                    SERVER_PROCESS = multiprocessing.Process(target=start) 
                    SERVER_PROCESS.start()
                    api.intercept_method(javaMethod['class'], javaMethod['method'])
    if ('native' in listJSON):
        nativeFunctions = listJSON['native']
        if (len(nativeFunctions) > 0):
            for nativeFunction in listJSON['native']:
                print(nativeFunction)
                api.trace_function(nativeFunction['module'], nativeFunction['function'])
    return {"errCode": 0, "errMsg": "Script Loaded."}

# trace native function by list
def _traceByAddress(baseAddr):
    global api
    api.trace_function_by_address(baseAddr)
    return {"errCode": 0, "errMsg": "Script Loaded."}

# websocket
from channels.generic.websocket import JsonWebsocketConsumer
from channels.exceptions import StopConsumer
class ChatConsumer(JsonWebsocketConsumer):
    def websocket_connect(self, message):
        self.accept()
        global consumer
        consumer = self
    def websocket_receive(self, message):
        print(message)
        msg = message['text']
        self.send(msg)
    def websocket_send(consumer, packet):
        print(packet)
        consumer.send_json(packet)
    def websocket_disconnect(self, message):
        # 服务端触发异常 StopConsumer
        raise StopConsumer

