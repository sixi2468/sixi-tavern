#!/usr/bin/env bash
# macOS：双击运行（需先安装 cloudflared：brew install cloudflared）
cd "$(dirname "$0")" || exit 1
exec bash ./公网演示.sh
