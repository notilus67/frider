# _*_ coding:utf-8 _*_
from django.shortcuts import render
from django.http import HttpResponse
import json

# dev
from server.functions import frida_ps
from server.functions import adb_parse
from server.functions import frida_unpack
from server.functions import frida_main

def getAppList(request):
    data = request.POST
    # print(data)
    if data['remote'] == '1':
        # To do 
        res = frida_ps.getAppListFromLAN(data['address'])
    else:
        res = frida_ps.getAppListFromUSB()
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def getAppInfo(request):
    data = request.POST
    res = adb_parse._getAppInfo(data['package'])
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def appUnpack(request):
    data = request.POST
    res = frida_unpack._appUnpack(data['selectedApp'], data['plan'])
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def injectApp(request): 
    data = request.POST
    res = frida_main._injectApp(data['package'])
    # if errCode = 0, save 'injectedApp' in frontend at the same time
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def enumJavaClasses(request):  # frontend TODO
    data = request.POST
    # 在前端检查是否已经有注入完成的APP
    res = frida_main._enumJavaClasses()
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def enumJavaMethods(request):
    data = request.POST
    # 在前端合成query: "class!method"
    res = frida_main._enumJavaMethods(data['query'])
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def enumNativeModules(request): 
    data = request.POST
    res = frida_main._enumNativeModules()
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def enumNativeExports(request): 
    data = request.POST
    res = frida_main._enumNativeExports(data['module'])
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def traceList(request): 
    data = request.POST
    res = frida_main._traceList(data['list'])
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

def traceByAddress(request): 
    data = request.POST
    res = frida_main._traceByAddress(data['baseAddr'])
    return HttpResponse(json.dumps(res), content_type="application/json,charset=utf-8")

