function _isJavaAvailable() {
    return Java.available
}

function _enumerateClasses() {
    const classes = null;
    Java.perform(function () {
        classes = Java.enumerateLoadedClassesSync()
    });
    return classes
}

function _enumerateMethods(query) {
    const methods = null;
    Java.perform(function () {
        methods = Java.enumerateMethods(query)
    });
    return methods
}

function _enumerateModules() {
    return Process.enumerateModules();
}

function _enumerateExports(soName) {
    //return Module.enumerateSymbols(soName);
    return Module.enumerateExports(soName);
}

function _enumerateExports(soName) {
    // return Module.enumerateSymbols(soName);
    // return Module.enumerateImports(soName);
    return Module.enumerateExports(soName);
}

function forwardData(api, data){
    var packet = {
        'cmd': 'proxy',
        'data': [api, data]
    };
    send("Frider:::" + JSON.stringify(packet));
    var retval = null;
    var op = recv('burp', function(value){
        retval = value.data;
    });
    op.wait();
    return JSON.parse(retval);
}

/** 
 * From here
 * modified from https://github.com/hluwa/ZenTracer/blob/master/trace.js
 * */
function getTid() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getId();
}

function getTName() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getName();
}

function getStack(){
	return (Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
}

function log(text) {
    var packet = {
        'cmd': 'log',
        'data': text
    };
    send("Frider:::" + JSON.stringify(packet))
}

function enter(tid, tname, cls, method, args) {
    var packet = {
        'cmd': 'enter',
        'data': [tid, tname, cls, method, args]
    };
    send("Frider:::" + JSON.stringify(packet));
}

function stack(tid, tname, cls, method, stack) {
    var packet = {
        'cmd': 'stack',
        'data': [tid, tname, cls, method, stack]
    };
    send("Frider:::" + JSON.stringify(packet))
}

function exit(tid, tname, cls, method, retval) {
    var packet = {
        'cmd': 'exit',
        'data': [tid, tname, cls, method, retval]
    };
    send("Frider:::" + JSON.stringify(packet))
}

function _traceMethod(className, methodNamePlus){
    if (methodNamePlus.indexOf('(') !== -1){  // remove signature
        var methodName = methodNamePlus.split('(')[0]
    }else{
        var methodName = methodNamePlus
    }
    Java.perform(function () {
        const targetClass = Java.use(className);    // get class
        const overloads = targetClass[methodName].overloads; // get all overloads
        overloads.forEach(function (overload){
            overload.implementation = function(){
                const args = [];
                const tid = getTid();
                const tName = getTName();
                for (var i=0; i<arguments.length; i++){
                    args.push(arguments[i]);
                }
                enter(tid, tName, className, methodNamePlus, args);
                const retval = this[methodName].apply(this, arguments);
                stack(tid, tName, className, methodNamePlus, getStack()); 
                exit(tid, tName, className, methodNamePlus, retval);
                return retval; // return to original method(overload) call
            }
        })
    });
}

/** 
 * Till here
 * modified from https://github.com/hluwa/ZenTracer/blob/master/trace.js
 * */

function _traceMethodWithParse(className, methodNamePlus){   // TODO
    if (methodNamePlus.indexOf('(') !== -1){  // remove signature
        var methodName = methodNamePlus.split('(')[0]
    }else{
        var methodName = methodNamePlus
    }
    Java.perform(function () {
        const targetClass = Java.use(className);    // get class
        const overloads = targetClass[methodName].overloads; // get all overloads
        Java.openClassFile("/data/local/tmp/r0gson.dex").load();
		const gson = Java.use("com.r0ysue.gson.Gson");
        overloads.forEach(function (overload){
            overload.implementation = function(){
                const args = [];
                for (var i=0; i<arguments.length; i++){
                    // args.push(gson.$new().toJson(arguments[i]));
                    args.push(arguments[i]);
                }
                const tid = getTid();
                const tName = getTName();
                enter(tid, tName, className, methodNamePlus, args);
                const retval = this[methodName].apply(this, arguments);
                gsonRetval = gson.$new().toJson(retval);
                exit(tid, gsonRetval);
                //exit(tid, retval);
                return retval; // return to original method(overload) call
            }
        })
    });
}

function _interceptMethod(className, methodNamePlus){
    if (methodNamePlus.indexOf('(') !== -1){  // remove signature
        var methodName = methodNamePlus.split('(')[0]
    }else{
        var methodName = methodNamePlus
    }
    Java.perform(function () {
        const targetClass = Java.use(className);    // get class
        const overloads = targetClass[methodName].overloads; // get all overloads
        overloads.forEach(function (overload){
            overload.implementation = function(){
                const api = className + '-' + methodName;
                var changedArgs = forwardData(api+'.args', arguments);
                for(var i=0;i<arguments.length;i++){
                    arguments[i] = changedArgs[i.toString()];
                }
                var retval = this[methodName].apply(this, arguments);
                retval = forwardData(api+'.retval', retval);
                return retval; // return to original method(overload) call
            }
        })
    });
}

function parse_hexDump(data){
    var lineArrays = hexdump(data).split("\n");
    var result = "";
    lineArrays.forEach(function(lineArray){
        result = result + lineArray.substring(lineArray.length-16);
    });
    result = result.substring(16, result.length)
    return result
}

function _findModulePath(moduleName){   // working
    const modules = Process.enumerateModules();
    modules.forEach(function(module){
        if(module['name'] == moduleName){
            return module['path'];
        }
    });
    return 'module not found';
}

/**
 * Write your native trace/intercept codes in
 * either  _traceFunctionByName,
 * or      _traceFunctionByAddress,
 */

function _traceFunctionByName(moduleName, functionName){ 
    const address = Module.findExportByName(moduleName, functionName);  // if you want to trace by name
    Interceptor.attach(address,{
        onEnter: function(args) {
            const tid = getTid();
            const tName = getTName();
            /***************************************
             * 
             *         parse native args here       
             *   
             *              ↓   ↓   ↓
             **************************************/
            // args[1].replace(0x01);  // e.g. change false to true 
            // enter(tid, tName, moduleName, functionName, args);
            // enter(tid, tName, moduleName, functionName, Memory.readCString(ptr(args[0])));
            stack(tid, tName, moduleName, functionName, "\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n"));
        },
        onLeave: function(retval) {
            const tid = getTid();
            const tName = getTName();
            /***************************************
             * 
             *        parse native retval here          
             * 
             *              ↓   ↓   ↓
             **************************************/
            // const parsedRetval = Memory.readCString(ptr(retval));        // Trace: read CString and 
            // exit(tid, tName, moduleName, functionName, parsedRetval);    // send message to frontend
            // retval.replace(0x01);   // e.g. change false to true 
        },  
    });  
}

function _traceFunctionByAddress(baseAddress){
    const offset = 0x111111111;  // necessary item;
    Interceptor.attach(baseAddress.add(offset),{
        onEnter: function(args) {
            const tid = getTid();
            const tName = getTName();
            /***************************************
             * 
             *         parse native args here       
             *   
             *              ↓   ↓   ↓
             **************************************/
            // args[1].replace(0x01);  // e.g. change false to true 
            // enter(tid, tName, moduleName, functionName, args);
            // enter(tid, tName, moduleName, functionName, Memory.readCString(ptr(args[0])));
            stack(tid, tName, moduleName, functionName, "\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n"));
        },
        onLeave: function(retval) {
            const tid = getTid();
            const tName = getTName();
            /***************************************
             * 
             *        parse native retval here          
             * 
             *              ↓   ↓   ↓
             **************************************/
            // const parsedRetval = Memory.readCString(ptr(retval));        // Trace: read CString and 
            // exit(tid, tName, moduleName, functionName, parsedRetval);    // send message to frontend
            // retval.replace(0x01);   // e.g. change false to true 
        },  
    });  
}


rpc.exports = {
    isJavaAvailable: function () {
        return _isJavaAvailable();
    },
    enumerateClasses: function () {
        return _enumerateClasses();
    },
    enumerateMethods: function (query) {
        return _enumerateMethods(query);
    },
    enumerateModules: function () {
        return _enumerateModules();
    },
    enumerateExports: function (soName) {
        return _enumerateExports(soName);
    },
    traceMethod: function (className, methodNamePlus) {
        return _traceMethod(className, methodNamePlus);
    },
    traceMethodWithParse: function (className, methodNamePlus) {
        return _traceMethodWithParse(className, methodNamePlus);
    },
    traceFunction: function (moduleName, functionName) {
        return _traceFunctionByName(moduleName, functionName);
    },
    traceFunctionByAddress: function (baseAddress) {
        return _traceFunctionByAddress(baseAddress);
    },
    interceptMethod: function (className, methodNamePlus) {
        return _interceptMethod(className, methodNamePlus);
    },
    _findModulePath: function (moduleName) {
        return _findModulePath(moduleName);
    },
};
