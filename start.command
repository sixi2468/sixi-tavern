#!/usr/bin/env bash
# macOS：双击本文件即可预览（若提示"无法打开"，右键 → 打开）
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 -u serve.py
else
  exec python -u serve.py
fi
