@echo off
cd /d "C:\Users\CU1\Desktop\Sql,Excel\문제해결\잡동사니\Note\Cursor"
call venv\Scripts\activate.bat
python -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0
pause





