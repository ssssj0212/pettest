# 🚀 빠른 시작 가이드

## 📋 요구사항 체크리스트

### 필수 설치 항목
- [x] Python 3.10+ 설치됨
- [x] Node.js 18+ 설치됨  
- [x] PostgreSQL (Neon) 연결 정보 있음
- [x] Google OAuth 클라이언트 ID/Secret 있음

---

## ⚡ 1분 안에 시작하기

### 방법 1: 자동 시작 스크립트 (추천)

1. **START_SERVERS.ps1 더블클릭**
   ```
   C:\Users\CU1\Desktop\Sql,Excel\문제해결\잡동사니\Note\Cursor\START_SERVERS.ps1
   ```

2. 10초 대기

3. 브라우저에서 접속
   ```
   http://localhost:3000
   ```

### 방법 2: 수동 시작

#### 터미널 1 - 백엔드
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 터미널 2 - 프론트엔드  
```powershell
cd frontend
npx next dev
```

---

## 🔧 환경변수 설정 (최초 1회만)

### Backend (.env 파일 존재 확인)
위치: `backend/.env`

```env
DATABASE_URL=postgresql+psycopg://neondb_owner:...
SECRET_KEY=강력한-랜덤-문자열-32자-이상
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (.env.local 파일 존재 확인)
위치: `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
BACKEND_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=64자-이상-랜덤-문자열
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🎯 첫 로그인 후 할 일

### 1. Google 로그인
http://localhost:3000 접속 → "로그인" 버튼 클릭

### 2. 관리자 권한 부여 (최초 1회)
```sql
-- Neon DB 접속
psql -U neondb_owner -h ep-lively-lake-ad0j968x-pooler.c-2.us-east-1.aws.neon.tech -d neondb

-- 본인을 관리자로 설정
UPDATE users SET role = 'ADMIN' WHERE email = '본인-구글-이메일@gmail.com';

-- 확인
SELECT email, name, role FROM users;
```

### 3. Admin 페이지 접속
http://localhost:3000/admin

---

## 🧪 동작 확인 체크리스트

### 백엔드 확인
```powershell
# Health Check
curl http://localhost:8000/health
# 예상 응답: {"ok":true,"environment":"development"}

# API 문서 확인
curl http://localhost:8000/docs
# Swagger UI가 표시되어야 함
```

### 프론트엔드 확인
```powershell
# 홈페이지
curl http://localhost:3000
# 200 OK 응답

# 로그인 페이지
curl http://localhost:3000/login
# 200 OK 응답
```

---

## ❌ 문제 해결

### 문제 1: "포트가 이미 사용 중입니다"

**해결:**
```powershell
# 모든 Node.js와 Python 프로세스 종료
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*"} | Stop-Process -Force

# 다시 시작
.\START_SERVERS.ps1
```

### 문제 2: "환경변수가 설정되지 않았습니다"

**해결:**
1. `backend/.env` 파일 확인
2. `frontend/.env.local` 파일 확인
3. 파일이 없으면 `env.example.txt` 참고하여 생성

### 문제 3: "백엔드 연결 실패"

**해결:**
```powershell
# 백엔드 로그 확인
cd backend
# 터미널에서 에러 메시지 확인

# 가상환경 재생성
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 문제 4: "프론트엔드 에러"

**해결:**
```powershell
cd frontend

# 캐시 삭제
Remove-Item -Recurse -Force .next

# node_modules 재설치 (필요시)
Remove-Item -Recurse -Force node_modules
npm install

# 재시작
npx next dev
```

---

## 📱 주요 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| 홈페이지 | http://localhost:3000 | 메인 페이지 |
| 로그인 | http://localhost:3000/login | Google OAuth 로그인 |
| Admin | http://localhost:3000/admin | 관리자 대시보드 |
| 쇼핑 | http://localhost:3000/shop | 상품 쇼핑 |
| 예약 | http://localhost:3000/reservations | 예약 관리 |
| 리뷰 | http://localhost:3000/reviews | 리뷰 작성 |
| 갤러리 | http://localhost:3000/gallery | 갤러리 |
| API 문서 | http://localhost:8000/docs | Swagger UI |
| Health | http://localhost:8000/health | 서버 상태 |

---

## 🔐 보안 체크리스트

### 환경변수
- [x] SECRET_KEY 강력한 랜덤 문자열 (32자+)
- [x] NEXTAUTH_SECRET 강력한 랜덤 문자열 (64자+)
- [x] DATABASE_URL에 실제 DB 연결 정보
- [x] GOOGLE_CLIENT_ID/SECRET 설정
- [x] ALLOWED_ORIGINS 명시적 설정

### 첫 실행 후
- [ ] 본인 계정을 ADMIN으로 설정
- [ ] Admin 페이지 접근 확인
- [ ] 모든 탭 정상 작동 확인
- [ ] 로그아웃/로그인 정상 작동 확인

---

## 🎓 다음 단계

### 개발
1. `DEBUGGING_REPORT.md` - 전체 흐름 이해
2. `SECURITY_AUDIT.md` - 보안 가이드라인
3. `.cursorrules` - 코딩 규칙

### 배포
1. `DEPLOYMENT_GUIDE.md` - Vercel 배포 가이드
2. 프로덕션 환경변수 설정
3. 도메인 연결

---

## 📞 지원

### 로그 확인
- 백엔드: 터미널 출력 확인
- 프론트엔드: 터미널 + 브라우저 콘솔

### 문서
- **TESTING_GUIDE.md** - 전체 테스트 가이드
- **IMPLEMENTATION_SUMMARY.md** - 구현 상세
- **FINAL_STATUS.md** - 현재 상태

---

## ✅ 현재 상태

**마지막 확인**: 2026-01-29  
**백엔드**: ✅ 정상 작동  
**프론트엔드**: ✅ 정상 작동  
**보안 점수**: A- (56/60)  
**상태**: 프로덕션 배포 준비 완료

---

**이제 START_SERVERS.ps1을 실행하고 http://localhost:3000 에 접속하세요!** 🚀
