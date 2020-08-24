import json
import threading
from server.functions import utils

allInfo = ''    # (string) all information of one app
len_allInfo = 0 # length of allInfo
result = {}     # result dictionary (retval)
lock = threading.Lock() # muti-threads
threads = []

# find infoTags and save to result(global dictionary) 
def findLine(infoTag):
    global allInfo, result, len_allInfo
    position_infoTag = allInfo.find(infoTag)
    if (position_infoTag == -1): # tag not found
        result[infoTag] = infoTag + "null" # save into result dictionary
    else:
        position_next_blank = allInfo.find('\r\n', position_infoTag, len_allInfo) # find row end
        result[infoTag] = allInfo[position_infoTag : position_next_blank]

def findLine2(infoTag2):
    global allInfo, result, len_allInfo
    position_infoTag = allInfo.find(infoTag2)
    if (position_infoTag == -1): # tag not found
        result[infoTag2] = infoTag2 + "\tnull" # save into result dictionary
    else:
        position_next_area = allInfo.find('\r\n    ', position_infoTag, len_allInfo)
        while (allInfo[position_next_area + 6] == ' '):
            # position_infoTag = position_next_area + 8
            position_next_area = allInfo.find('\r\n    ', position_next_area + 1, len_allInfo)
        result[infoTag2] = allInfo[position_infoTag : position_next_area]

def getAndroidVersion():
    command = 'adb shell getprop ro.build.version.release'
    lines = utils.shell_execution(command)
    AndroidVersion = lines[0].strip()
    return {"errCode":0, "result": AndroidVersion}

def _getAppInfo(packageName):
    global allInfo, result, len_allInfo
    # run adb shell dumpsys package <package_name> in shell
    command = 'adb shell dumpsys package {}'.format(packageName)
    lines = utils.shell_execution(command)
    allInfo = ''.join(lines)  # list to string
    len_allInfo = len(allInfo)
    infoTags = [ # whose value is in the same line
        "versionName=",
        "versionCode=",
        "minSdk=",
        "flags=",
        "privateFlags=",
        "lastUpdateTime=",
        "primaryCpuAbi=",
        "secondaryCpuAbi=",
        "Instruction Set:",
        "path:",
        "status:",
        "codePath=",
        "resourcePath=",
        "legacyNativeLibraryDir=",
        "dataDir=",
    ]
    infoTags2 = [   # whose value is in next lines
        "usesLibraryFiles",
        "usesOptionalLibraries",
        "declared permissions:",
        "requested permissions:",
    ]
    
    # muti-threads search infoTags
    for infoTag in infoTags:
        t = threading.Thread(target=findLine, args=(infoTag, ))
        threads.append(t)
        t.start()
    for infoTag2 in infoTags2:
        t = threading.Thread(target=findLine2, args=(infoTag2,))
        threads.append(t)
        t.start()
    # wating for threads to end
    for t in threads:
        t.join()

    result_list = [
        ('package', packageName), 
        ('versionName', result['versionName='][12:]),
        ('versionCode', result['versionCode='][12:].split(' ')[0]),
        ('sdk', result['minSdk=']),
        ('flags', result['flags=']),
        ('privateFlags', result['privateFlags=']),
        ('lastUpdateTime', result['lastUpdateTime='][15:]),
        ('primaryCpuAbi', result['primaryCpuAbi=']),
        ('secondaryCpuAbi', result['secondaryCpuAbi=']),
        ('instructionSet', result['Instruction Set:']),
        ('path', result['path:']),
        ('status', result['status:']),
        ('codePath', result['codePath=']),
        ('resourcePath', result['resourcePath=']),
        ('legacyNativeLibraryDir', result['legacyNativeLibraryDir=']),
        ('dataDir', result['dataDir=']),
        ('usesLibraryFiles', result['usesLibraryFiles']),
        ('usesOptionalLibraries', result['usesOptionalLibraries']),
        ('declaredPermissions', result['declared permissions:']),
        ('requestedPermissions', result['requested permissions:'])
    ]
    return {"errCode":0, "result":(dict(result_list))}
