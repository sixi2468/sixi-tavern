#!/usr/bin/env python3
"""四夕酒馆 · 本地预览服务器
选一个空闲端口，打开浏览器，并在终端打印手机可访问的局域网地址。
"""
import http.server
import os
import socket
import sys
import threading
import traceback
import webbrowser

LOG_NAME = "预览日志.txt"


def log(msg):
    print(msg, flush=True)
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), LOG_NAME), "a", encoding="utf-8") as f:
            f.write(str(msg) + "\n")
    except Exception:
        pass


def free_port():
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]
    finally:
        s.close()


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return ""


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base)
    log("=" * 52)
    log("Python: " + sys.version.replace("\n", " "))
    log("目录: " + base)
    port = free_port()
    log("四夕酒馆已启动")
    log("  本机：http://127.0.0.1:%d" % port)
    ip = lan_ip()
    if ip:
        log("  手机（同一 Wi-Fi）：http://%s:%d" % (ip, port))
    log("")
    log("保持本窗口打开；按 Ctrl+C 或关闭窗口即停止。")
    log("")

    threading.Timer(1.5, lambda: webbrowser.open("http://127.0.0.1:%d/" % port)).start()

    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), http.server.SimpleHTTPRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("启动失败，错误信息如下：")
        log(traceback.format_exc())
        raise
