# 四夕酒馆 · 公网演示（Windows）
# 双击 公网演示.bat 即可；也可右键本文件 → 使用 PowerShell 运行
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "没有找到 cloudflared，先装一次（任选其一）：" -ForegroundColor Yellow
  Write-Host "  1) 在 PowerShell 里执行： winget install cloudflare.cloudflared"
  Write-Host "  2) 或到 Cloudflare 官网下载 cloudflared.exe，放到本文件夹"
  Write-Host ""
  Read-Host "按回车退出"
  exit 1
}

# 找 Python
$py = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $py = "python" }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $py = "py" }
else {
  Write-Host "没有找到 Python，请先安装 Python 3（勾选 Add Python to PATH）" -ForegroundColor Yellow
  Read-Host "按回车退出"
  exit 1
}

# 找空端口
$port = 8000
while ($true) {
  $busy = $false
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $listener.Start(); $listener.Stop()
  } catch { $busy = $true }
  if (-not $busy) { break }
  $port++
}

Write-Host "正在启动本地服务（端口 $port）..." -ForegroundColor DarkGray
$srv = Start-Process -FilePath $py -ArgumentList "-m","http.server",$port -PassThru -WindowStyle Hidden

$log = Join-Path $env:TEMP "sixi-tunnel.log"
if (Test-Path $log) { Remove-Item $log -Force }
Write-Host "正在建立临时公网隧道（约 5-10 秒）..." -ForegroundColor DarkGray
$cf = Start-Process -FilePath "cloudflared" `
  -ArgumentList "tunnel","--url","http://localhost:$port","--no-autoupdate","--protocol","http2" `
  -PassThru -WindowStyle Hidden -RedirectStandardError $log

$url = $null
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $m = Select-String -Path $log -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1
    if ($m) { $url = $m.Matches[0].Value; break }
  }
}

Write-Host ""
if ($url) {
  Write-Host "四夕酒馆 · 公网演示" -ForegroundColor Green
  Write-Host "  手机/任何设备打开： $url" -ForegroundColor Cyan
  Write-Host "  （临时地址，按回车即停止并失效）"
  Write-Host ""
  Start-Process $url
} else {
  Write-Host "隧道没能建立，日志如下：" -ForegroundColor Yellow
  if (Test-Path $log) { Get-Content $log -Tail 8 }
}

Read-Host "按回车停止服务"
Stop-Process -Id $cf.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue
