#!/usr/bin/env bash
# 局域网不通时用：把本站临时发布到一个公网 https 地址（需 cloudflared）
cd "$(dirname "$0")" || exit 1

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "没有找到 cloudflared。先装一次："
  echo "  macOS : brew install cloudflared"
  echo "  Windows: winget install cloudflare.cloudflared"
  echo "  Linux : 见 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi

port_free() {
  python3 - "$1" <<'PY'
import socket, sys
s = socket.socket()
try:
    s.bind(("127.0.0.1", int(sys.argv[1])))
except OSError:
    sys.exit(1)
finally:
    s.close()
PY
}

PORT="${PORT:-8000}"
while ! port_free "$PORT"; do PORT=$((PORT + 1)); done

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
LOG="$(mktemp "${TMPDIR:-/tmp}/sixi-tunnel.XXXXXX")"
cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate --protocol http2 >"$LOG" 2>&1 &
CF=$!
cleanup() { kill "$CF" "$SRV" 2>/dev/null; wait 2>/dev/null; }
trap cleanup EXIT INT TERM

URL=""
for _ in $(seq 1 40); do
  URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1)"
  [ -n "$URL" ] && break
  sleep 1
done

if [ -z "$URL" ]; then
  echo "隧道没起来，日志：$LOG"
  tail -5 "$LOG"
  exit 1
fi

echo "四夕酒馆 · 公网演示"
echo "  手机/任何设备打开：$URL"
echo "  （这是临时地址，Ctrl+C 关闭即失效）"
echo
wait "$CF"
