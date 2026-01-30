# 전체 기능 자동 테스트 스크립트

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   전체 기능 테스트 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @()

# 테스트 1: 백엔드 Health Check
Write-Host "[1/8] 백엔드 Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    if ($response.ok -eq $true) {
        Write-Host "✅ PASS: 백엔드 정상" -ForegroundColor Green
        $testResults += "✅ 백엔드 Health Check"
    } else {
        Write-Host "❌ FAIL: 백엔드 응답 이상" -ForegroundColor Red
        $testResults += "❌ 백엔드 Health Check"
    }
} catch {
    Write-Host "❌ FAIL: 백엔드 연결 실패" -ForegroundColor Red
    $testResults += "❌ 백엔드 Health Check"
}

# 테스트 2: 백엔드 Root Endpoint
Write-Host "[2/8] 백엔드 Root Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000" -Method Get -TimeoutSec 5
    if ($response.message) {
        Write-Host "✅ PASS: Root endpoint 정상" -ForegroundColor Green
        $testResults += "✅ 백엔드 Root"
    } else {
        Write-Host "❌ FAIL: Root endpoint 응답 이상" -ForegroundColor Red
        $testResults += "❌ 백엔드 Root"
    }
} catch {
    Write-Host "❌ FAIL: Root endpoint 연결 실패" -ForegroundColor Red
    $testResults += "❌ 백엔드 Root"
}

# 테스트 3: API 문서 (Swagger)
Write-Host "[3/8] API 문서 접근..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: API 문서 접근 가능" -ForegroundColor Green
        $testResults += "✅ API 문서"
    }
} catch {
    Write-Host "❌ FAIL: API 문서 접근 실패" -ForegroundColor Red
    $testResults += "❌ API 문서"
}

# 테스트 4: 프론트엔드 홈페이지
Write-Host "[4/8] 프론트엔드 홈페이지..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: 홈페이지 접근 가능" -ForegroundColor Green
        $testResults += "✅ 프론트엔드 홈"
    }
} catch {
    Write-Host "❌ FAIL: 홈페이지 접근 실패" -ForegroundColor Red
    $testResults += "❌ 프론트엔드 홈"
}

# 테스트 5: 로그인 페이지
Write-Host "[5/8] 로그인 페이지..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: 로그인 페이지 접근 가능" -ForegroundColor Green
        $testResults += "✅ 로그인 페이지"
    }
} catch {
    Write-Host "❌ FAIL: 로그인 페이지 접근 실패" -ForegroundColor Red
    $testResults += "❌ 로그인 페이지"
}

# 테스트 6: Shop 페이지
Write-Host "[6/8] Shop 페이지..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/shop" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Shop 페이지 접근 가능" -ForegroundColor Green
        $testResults += "✅ Shop 페이지"
    }
} catch {
    Write-Host "❌ FAIL: Shop 페이지 접근 실패" -ForegroundColor Red
    $testResults += "❌ Shop 페이지"
}

# 테스트 7: Reservations 페이지
Write-Host "[7/8] Reservations 페이지..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/reservations" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Reservations 페이지 접근 가능" -ForegroundColor Green
        $testResults += "✅ Reservations 페이지"
    }
} catch {
    Write-Host "❌ FAIL: Reservations 페이지 접근 실패" -ForegroundColor Red
    $testResults += "❌ Reservations 페이지"
}

# 테스트 8: CORS 헤더 확인
Write-Host "[8/8] CORS 설정 확인..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Options -UseBasicParsing -TimeoutSec 5 -Headers @{"Origin"="http://localhost:3000"}
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✅ PASS: CORS 설정 정상" -ForegroundColor Green
        $testResults += "✅ CORS 설정"
    } else {
        Write-Host "⚠️  WARN: CORS 헤더 미확인" -ForegroundColor Yellow
        $testResults += "⚠️ CORS 설정"
    }
} catch {
    Write-Host "⚠️  WARN: CORS 테스트 실패 (정상일 수 있음)" -ForegroundColor Yellow
    $testResults += "⚠️ CORS 설정"
}

# 결과 요약
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   테스트 결과 요약" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($testResults | Where-Object { $_ -like "✅*" }).Count
$failCount = ($testResults | Where-Object { $_ -like "❌*" }).Count
$warnCount = ($testResults | Where-Object { $_ -like "⚠️*" }).Count
$totalCount = $testResults.Count

Write-Host "총 테스트: $totalCount" -ForegroundColor White
Write-Host "성공: $passCount" -ForegroundColor Green
Write-Host "실패: $failCount" -ForegroundColor Red
Write-Host "경고: $warnCount" -ForegroundColor Yellow
Write-Host ""

foreach ($result in $testResults) {
    Write-Host $result
}

Write-Host ""

if ($failCount -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   🎉 모든 테스트 통과!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "브라우저에서 테스트하세요:" -ForegroundColor Yellow
    Write-Host "1. http://localhost:3000 접속" -ForegroundColor White
    Write-Host "2. Google 로그인" -ForegroundColor White
    Write-Host "3. Admin 페이지 접속 (관리자만)" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   ❌ 일부 테스트 실패" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "문제 해결:" -ForegroundColor Yellow
    Write-Host "1. START_SERVERS.ps1 실행했는지 확인" -ForegroundColor White
    Write-Host "2. 환경변수 설정 확인 (.env, .env.local)" -ForegroundColor White
    Write-Host "3. 백엔드/프론트엔드 로그 확인" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
