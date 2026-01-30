# 서버 시작 스크립트 - 백엔드와 프론트엔드 동시 실행

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   서버 시작 중..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 기존 프로세스 종료
Write-Host "[1/5] 기존 프로세스 정리 중..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 백엔드 시작
Write-Host "[2/5] 백엔드 서버 시작 중..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
cd $backendPath

$envFile = Join-Path $backendPath ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.+)$') {
            $name = $matches[1].Trim()
            $val = $matches[2].Trim('"')
            [Environment]::SetEnvironmentVariable($name, $val, 'Process')
        }
    }
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal
Start-Sleep -Seconds 5

# 프론트엔드 .next 캐시 삭제
Write-Host "[3/5] 프론트엔드 캐시 정리 중..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
$nextPath = Join-Path $frontendPath ".next"
if (Test-Path $nextPath) {
    Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
}

# 프론트엔드 시작
Write-Host "[4/5] 프론트엔드 서버 시작 중..." -ForegroundColor Yellow
cd $frontendPath
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npx next dev" -WindowStyle Normal
Start-Sleep -Seconds 8

# 서버 상태 확인
Write-Host "[5/5] 서버 상태 확인 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ 백엔드 정상: $($backendHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ 백엔드 연결 실패" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ 프론트엔드 정상: HTTP $($frontendResponse.StatusCode)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 프론트엔드 연결 실패" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   서버 시작 완료!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 프론트엔드: http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 백엔드: http://localhost:8000" -ForegroundColor Green
Write-Host "📖 API 문서: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "브라우저를 열고 http://localhost:3000 접속하세요!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
