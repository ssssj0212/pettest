$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\CU1\Desktop\Sql,Excel\문제해결\잡동사니\Note\Cursor"
Set-Location $projectRoot
$pythonPath = Join-Path $projectRoot "venv\Scripts\python.exe"
& $pythonPath -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0





