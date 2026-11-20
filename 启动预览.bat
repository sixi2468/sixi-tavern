@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 四夕酒馆 · 本地预览（v9）
echo 四夕酒馆 本地预览 v9
echo 正在启动，请稍等（窗口不会自动关闭）...
cmd /k "py -3 serve.py || python serve.py || (echo. & echo 没能启动本地服务，改为直接打开 index.html & start "" index.html)"
