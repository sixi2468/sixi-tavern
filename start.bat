@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 四夕酒馆 · 本地预览

set "PY="
where py >nul 2>nul
if %errorlevel%==0 set "PY=py -3"
if not defined PY (
  where python >nul 2>nul
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo.
  echo 没有找到 Python。
  echo 请去 python.org 安装 Python 3，安装时勾选 "Add Python to PATH"，然后重新双击本文件。
  echo.
  pause
  exit /b 1
)

%PY% "%~dp0serve.py"
set "CODE=%errorlevel%"

echo.
if not "%CODE%"=="0" (
  echo 服务启动失败（错误码 %CODE%）。
  echo 详情已写入 预览日志.txt，把那个文件发给我即可。
) else (
  echo 服务已停止。
)
echo.
pause
