# frider

Dump dex, trace/intercept Java/native function. Based on React, Django, Frida, adb. 

## Features

- enumerate Android APPs
- show basic information 
- unpack app, dump dex
- enumerate Java classes & methods
- enumerate Native modules & export functions/variables
- trace arguments & retval of Java methods (needs Burp to intercept)
- trace arguments & retval of native function (not really, requires user to finish related arguments parsing)

## Install

Make sure you are using **latest** frida-tools and frida-server (test on 12.11.9). 

```
(dev version)
git clone https://github.com/refate/fider
cd backend && pip3 install -r requirements.txt
cd frontend && npm install

(release version)
download latest release, and copy frontend/ to your local server.
```

## Usage

Please refer to [wiki page](https://github.com/refate/frider/wiki/Usage)

[中文版wiki](https://github.com/refate/frider/wiki/Usage-CN)

## Reference & Thanks

[monkeylord/XServer](https://github.com/monkeylord/XServer)

[viva-frida/Awesome--Frida-UI](https://github.com/viva-frida/Awesome--Frida-UI)

[GuoQiang1993/Frida-Apk-Unpack](https://github.com/GuoQiang1993/Frida-Apk-Unpack)

[hluwa/FRIDA-DEXDump](https://github.com/hluwa/FRIDA-DEXDump)

[T3rry7f/Hijacker](https://github.com/T3rry7f/Hijacker)

[Ant Design](https://ant.design/)

## TODO

bug fix

## Change log 

2020/08/24 v0.1.0