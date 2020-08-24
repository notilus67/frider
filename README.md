# frider

中文版点我

Dump unpacked dex, trace/intercept Java/native function. Based on React, Django, Frida, adb. 

## Install & Settings

Make sure you are using **latest** frida-tools and frida-server. 

```
(dev version)
git clone https://github.com/refate/fider
cd backend && pip3 install -r requirements.txt
cd frontend && npm install

(release version)
download latest release, and copy frontend/ to your local server.
```
Default Burp listener is 127.0.0.1:8080, change at `backend/server/functions/frida_main.py`

## Usage

### 1. Start

Run backend (Django server):
```
cd backend 
python3 manage.py runserver
```
Run frontend (React.js):
```
cd frontend
npm start (dev version) or visit localhost:3000 (release version)
```

Run **latest** frida-server (test on 12.11.9) on your USB-attached Android device. 

### 2. Select APP

Press `Connect`. The encoding should be with your cmd setting, change at `backend/server/functions/utils.py`, default: GBK.  

Select one APP and move on to other pages. 

### 3-1. APP info

Provides a table of basic APP information like versionCode, permissions, paths, instruction sets. This feature may not work on some adb versions. 

### 3-2. APP unpack

Read **Tips** on the page, choose a plan to dump dex files. The dex files may also exist in `/data/data/(packageName)` and `/sdcard/Frider/(packageName)`.

### 4-1. Java class/method enumerate

Press `Inject` to inject frida script into selected app if you have not done it. 

Choose either Plan A or Plan B to enumerate Java methods. 

Click method nodes in the Method List to add them into your TraceList. 

### 4-2. Java method trace

Move to Java -> Trace page. 

If you want to intercept arguments/retval, please start Burp Suite (etc.) and listen 127.0.0.1:8080. Enable the `Intercept(Java) ?` button on the page. 

Now you can press `Start` of Plan A. 

## Reference

XServer
awesome
burp
dexdump
