# 실행 중인 서버를 모두 중지하는 스크립트
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🛑 서버 중지 중..." -ForegroundColor Yellow

# PID 파일에서 프로세스 ID 읽기
$backendPidFile = "$projectRoot\.backend.pid"
$frontendPidFile = "$projectRoot\.frontend.pid"

if (Test-Path $backendPidFile) {
    $backendPid = Get-Content $backendPidFile
    try {
        Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
        Write-Host "✅ 백엔드 서버 중지됨 (PID: $backendPid)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  백엔드 서버 프로세스를 찾을 수 없습니다." -ForegroundColor Yellow
    }
    Remove-Item $backendPidFile -ErrorAction SilentlyContinue
}

if (Test-Path $frontendPidFile) {
    $frontendPid = Get-Content $frontendPidFile
    try {
        Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
        Write-Host "✅ 프론트엔드 서버 중지됨 (PID: $frontendPid)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  프론트엔드 서버 프로세스를 찾을 수 없습니다." -ForegroundColor Yellow
    }
    Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
}

# 포트를 사용하는 프로세스도 확인
$backendPort = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($backendPort) {
    $backendPort | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ 포트 8000 사용 프로세스 중지됨" -ForegroundColor Green
    }
}

if ($frontendPort) {
    $frontendPort | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ 포트 3000 사용 프로세스 중지됨" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ 모든 서버가 중지되었습니다." -ForegroundColor Green







