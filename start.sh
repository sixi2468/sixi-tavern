#!/usr/bin/env bash
# Linux / macOS 终端版：./start.sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 -u serve.py
elif command -v python >/dev/null 2>&1; then
  exec python -u serve.py
else
  echo "没有找到 Python，请先安装 Python 3"
  exit 1
fi
