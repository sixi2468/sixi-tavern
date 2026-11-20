#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then exec python3 -u serve.py; else exec python -u serve.py; fi
