import subprocess
import threading

encoding = 'GBK' # encode (GBK/utf-8) of your shell/cmd

def shell_execution(command):
    pipe= subprocess.Popen(command,shell=True,stdout=subprocess.PIPE)
    lines = pipe.stdout.readlines()
    # bytes to str, with encoding
    counter = 0
    for line in lines:
        lines[counter] = str(line, encoding)
        counter = counter + 1
    return lines

