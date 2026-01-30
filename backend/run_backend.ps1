# backend/run_backend.ps1

Write-Host "Starting FastAPI backend (stable mode)..."

# 가상환경 활성화 (이미 venv 사용 중이면 문제 없음)
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
}

# 기존 8000 포트 점유 프로세스 정리 (있을 경우만)
$port = 8000
$existing = netstat -ano | findstr ":$port"
if ($existing) {
    Write-Host "Port 8000 already in use. Stopping existing process..."
    $pid = ($existing -split "\s+")[-1]
    taskkill /PID $pid /F | Out-Null
}

# uvicorn 실행 (reload ❌)
uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info
