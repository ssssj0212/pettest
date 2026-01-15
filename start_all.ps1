# 프론트엔드와 백엔드를 동시에 실행하는 통합 스크립트
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "🚀 서버 시작 중..." -ForegroundColor Cyan
Write-Host ""

# 백엔드 서버 시작
Write-Host "📦 백엔드 서버 시작 중 (포트 8000)..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot'; `$env:PYTHONIOENCODING='utf-8'; .\venv\Scripts\Activate.ps1; python -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0"
) -PassThru

Start-Sleep -Seconds 2

# 프론트엔드 서버 시작
Write-Host "🎨 프론트엔드 서버 시작 중 (포트 3000)..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\frontend'; npm run dev"
) -PassThru

Write-Host ""
Write-Host "✅ 서버가 시작되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 접속 주소:" -ForegroundColor Cyan
Write-Host "   프론트엔드: http://localhost:3000" -ForegroundColor White
Write-Host "   백엔드 API: http://localhost:8000" -ForegroundColor White
Write-Host "   백엔드 Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 서버를 중지하려면 각 PowerShell 창에서 Ctrl+C를 누르세요." -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ 서버가 완전히 시작될 때까지 몇 초 기다려주세요..." -ForegroundColor Gray

# 프로세스 ID 저장 (필요시 종료용)
$backendProcess.Id | Out-File -FilePath "$projectRoot\.backend.pid" -Encoding ASCII
$frontendProcess.Id | Out-File -FilePath "$projectRoot\.frontend.pid" -Encoding ASCII




