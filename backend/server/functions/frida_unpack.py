import frida
import click
import hashlib
import time
import json
import os, sys
from server.functions import frida_main
from server.functions import utils

# Reference:
# https://github.com/hluwa/FRIDA-DEXDump (Arthur: hluwa)
# https://github.com/GuoQiang1993/Frida-Apk-Unpack/blob/master/dexDump.js (Arthur: GuoQiang1993)

md5 = lambda bs: hashlib.md5(bs).hexdigest()

def get_all_process(device, pkgname):
    return [process for process in device.enumerate_processes() if process.name == pkgname]

def stop_other(pid, processes):
    try:
        for process in processes:
            if process.pid == pid:
                os.system("adb shell \"su -c 'kill -18 {}'\"".format(process.pid))
            else:
                os.system("adb shell \"su -c 'kill -19 {}'\"".format(process.pid))
    except:
        pass

def choose(pid=None, pkg=None, spawn=False, device=None):
    if pid is None and pkg is None:
        target = device.get_frontmost_application()
        return target.pid, target.identifier

    for process in device.enumerate_processes():
        if (pid and process.pid == pid) or (pkg and process.name == pkg):
            if not spawn:
                return process.pid, process.name
            else:
                pkg = process.name
                break

    if pkg and spawn and device:
        pid = device.spawn(pkg)
        device.resume(pid)
        return pid, pkg
    raise Exception("Cannot found <{}> process".format(pid))

def dump(pkg_name, api, mds=None):
    if mds is None:
        mds = []
    matches = api.scandex()
    for info in matches:
        try:
            bs = api.memorydump(info['addr'], info['size'])
            md = md5(bs)
            if md in mds:
                click.secho("[DEXDump]: Skip duplicate dex {}<{}>".format(info['addr'], md), fg="blue")
                continue
            mds.append(md)
            if not os.path.exists("./server/output/" + pkg_name + "/"):
                os.mkdir("./server/output/" + pkg_name + "/")
            if bs[:4] != b"dex\n":
                bs = b"dex\n035\x00" + bs[8:]
            with open("./server/output/" + pkg_name + "/" + info['addr'] + ".dex", 'wb') as out:
                out.write(bs)
            click.secho("[DEXDump]: DexSize={}, DexMd5={}, SavePath={}/server/output/{}/{}.dex"
                        .format(hex(info['size']), md, os.getcwd(), pkg_name, info['addr']), fg='green')
        except Exception as e:
            click.secho("[Except] - {}: {}".format(e, info), bg='yellow')

def _appUnpack(selectedApp, plan):
    scriptDir = './server/functions/frida_scripts/'
    package = json.loads(selectedApp)['package']
    pid = json.loads(selectedApp)['pid']
    if (plan == "Frida-Apk-Unpack"):
        scriptPath = scriptDir + 'dexDump.js'
        with open(scriptPath, 'r', encoding='utf-8') as f:
            scriptCode = f.read()
        # Unpack
        try:
            device = frida_main.get_usb_device()
            pid = device.spawn([package])
            session = device.attach(pid)
            script = session.create_script(scriptCode)
            script.load()
            device.resume(pid)
        except Exception as ex:
            # script execution failed
            return { "errCode": 1, "errMsg": str(ex) }

        try: 
            # Pull /data/data/[processName]/[dex_size].dex to /backend/server/output/ on PC
            command = "adb root && adb pull /data/data/{}/ ./server/output/".format(package,)
            lines = utils.shell_execution(command)
            if ("adbd cannot run as root" in lines[0]):        # if adb root failed, try following:
                # if doesn't exist, make program folder
                command1 = "adb shell \"su -c 'mkdir /sdcard/frider;'\"" 
                # if doesn't exist, make app folder
                command2 = "adb shell \"su -c 'cd /sdcard/frider;mkdir {};'\"".format(package,)
                # copy to sdcard
                command3 = "adb shell \"su -c 'cp /data/data/{}/dump_* /sdcard/frider/{};'\"".format(package, package) 
                # pull dex on sdcard to local folder
                command4 = "adb pull /sdcard/frider/{} ./server/output/".format(package,)
                utils.shell_execution(command1)
                utils.shell_execution(command2)
                utils.shell_execution(command3)
                utils.shell_execution(command4)
            return { "errCode": 0 }
        except Exception as ex:
            # ERROR: copy to PC failed
            return { "errCode": 2, "errMsg": str(ex) }

    elif (plan == "FRIDA-DEXDump"):
        scriptPath = scriptDir + 'agent.js'
        try:
            device = frida_main.get_usb_device()
        except Exception as ex:
            # ERROR: script execution failed
            return { "errCode": 1, "errMsg": str(ex) }

        try:
            pid, pname = choose(device=device)
        except Exception as e:
            string = "[Except] - Unable to inject into process: {} in \n{}".format(e, traceback.format_tb(sys.exc_info()[2])[-1])
            click.secho(string, bg='red')
            # ERROR: script execution failed
            return { "errCode": 1, "errMsg": string }
                
        processes = get_all_process(device, package)
        if (processes == []):
            # ERROR: Target APP is not running
            return { "errCode": 3, "errMsg": "Target Process Not Found" }
        mds = []
        for process in processes:
            click.secho("[DEXDump]: found target [{}] {}".format(process.pid, process.name), bg='green')
            stop_other(process.pid, processes)
            with open(scriptPath, 'r', encoding='utf-8') as f:
                scriptCode = f.read()
            try:
                session = device.attach(process.pid)
            except Exception as ex:
                # ERROR: script execution failed
                return { "errCode": 1, "errMsg": str(ex) }
            script = session.create_script(scriptCode)
            script.load()
            dump(package, script.exports, mds=mds)
            script.unload()
            session.detach()
        return { "errCode": 0 }

    else:
        scriptPath = scriptDir + 'custom.js'
        # ERROR: Todo
        return { "errCode": 4, "errMsg": "Unfinished feature"  }

