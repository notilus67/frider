import json
from server.functions import utils

def getAppListFromUSB():
    command = 'frida-ps -Uai'
    lines = utils.shell_execution(command)
    
    try:
        # command execution parse
        if ("PID" in lines[0]):
            lines = lines[2:]
        if ("PID" in lines[1]):
            lines = lines[3:]
    except Exception:
        # frida-server connection error
        return {"errCode":1, "errMsg":lines[0]}

    # serialize process list
    processInfos = list()
    key = 1 # counter, as unique mark of one process
    for line in lines:
        processInfo = line.split()
        processInfo_list = [
            ('key', str(key)), 
            ('pid', processInfo[0]),
            ('name', ' '.join(processInfo[1:-1])),  # blank space may exists in process/app name
            ('identifier', processInfo[-1])
        ]
        processInfos.append(dict(processInfo_list)) # list[dict] ~= json
        key = key + 1 # counter, as unique mark of one process

    return {"errCode":0, "result":processInfos}

def getAppListFromLAN():
    # To do 
    return null