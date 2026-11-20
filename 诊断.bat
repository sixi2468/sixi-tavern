@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo 四夕酒馆 · 环境诊断
echo ==========================================
echo.
echo 当前目录：
cd
echo.
echo 关键文件：
if exist index.html (echo   index.html  OK) else (echo   index.html  缺失)
if exist serve.py   (echo   serve.py    OK) else (echo   serve.py    缺失)
if exist assets\css\main.css (echo   assets      OK) else (echo   assets      缺失)
echo.
echo Python：
where py
where python
echo.
py -3 -c "import sys;print(sys.version)" 2>nul
python -c "import sys;print(sys.version)" 2>nul
echo.
echo 试着启动服务（按 Ctrl+C 可停止）：
echo.
py -3 serve.py 2>nul || python serve.py
echo.
echo 如果上面出现红色报错，把整个窗口截图发给我。
pause
