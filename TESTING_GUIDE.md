# 🧪 전체 테스트 및 검증 가이드

## 📋 목차
1. [환경 설정](#환경-설정)
2. [데이터베이스 초기화](#데이터베이스-초기화)
3. [로그인 흐름 테스트](#로그인-흐름-테스트)
4. [권한 체크 테스트](#권한-체크-테스트)
5. [Admin 기능 테스트](#admin-기능-테스트)
6. [보안 테스트](#보안-테스트)
7. [트러블슈팅](#트러블슈팅)

---

## 🔧 환경 설정

### 1. 환경변수 설정

#### Backend (.env)
```bash
cd backend

# SECRET_KEY 생성
python -c "import secrets; print(secrets.token_urlsafe(32))"
# 출력된 문자열을 복사

# .env 파일 생성
cp env.example.txt .env

# .env 파일 수정
nano .env
# 또는 vscode: code .env
```

```bash
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/reservation_db
SECRET_KEY=여기에_복사한_문자열_붙여넣기
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVIRONMENT=development
```

#### Frontend (.env.local)
```bash
cd frontend

# NEXTAUTH_SECRET 생성
openssl rand -base64 64
# 출력된 문자열을 복사

# .env.local 파일 생성
cp env.example.txt .env.local

# .env.local 파일 수정
nano .env.local
```

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000
BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=실제_클라이언트_ID
GOOGLE_CLIENT_SECRET=실제_클라이언트_시크릿
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=여기에_복사한_문자열_붙여넣기
```

### 2. Google OAuth 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 생성** (없는 경우)
   - "새 프로젝트" 클릭

3. **OAuth 동의 화면 설정**
   - API 및 서비스 → OAuth 동의 화면
   - 사용자 유형: 외부
   - 앱 이름, 이메일 등 입력

4. **OAuth 2.0 클라이언트 ID 생성**
   - API 및 서비스 → 사용자 인증 정보
   - "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI 추가:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (프로덕션)

5. **클라이언트 ID 및 시크릿 복사**
   - `.env.local`에 붙여넣기

---

## 💾 데이터베이스 초기화

### 1. PostgreSQL 실행 확인
```bash
# PostgreSQL 상태 확인
psql --version

# 데이터베이스 접속 테스트
psql -U user -h localhost -p 5432 -d reservation_db
```

### 2. 테이블 생성
```bash
cd backend

# 가상환경 활성화
source venv/bin/activate  # Linux/Mac
# 또는
.\venv\Scripts\activate  # Windows

# 테이블 생성
python init_db.py
```

### 3. 관리자 계정 생성
```bash
# seed_data.py 실행 또는 직접 SQL
psql -U user -h localhost -d reservation_db

# 관리자 계정 추가
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'your-email@gmail.com',
  '',  -- Google OAuth 사용자는 비밀번호 불필요
  'Admin User',
  'ADMIN',
  TRUE
);

# 확인
SELECT id, email, name, role FROM users;
```

---

## 🔐 로그인 흐름 테스트

### 1. 서버 시작
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Health Check
```bash
# Backend
curl http://localhost:8000/health
# 예상: {"ok": true, "environment": "development"}

# Frontend
curl http://localhost:3000
# 예상: HTML 응답
```

### 3. 로그인 테스트

#### 브라우저에서 테스트
1. **http://localhost:3000 접속**
2. **"로그인" 버튼 클릭**
3. **Google 계정 선택**
4. **권한 승인**
5. **홈페이지로 리다이렉트 확인**

#### 콘솔 확인
```bash
# Frontend 콘솔 (브라우저 개발자 도구)
# 1. NextAuth 세션 확인
console.log(await getSession())
# 예상: { user: { id, email, name }, expires }

# 2. accessToken이 세션에 없는지 확인 (보안)
console.log((await getSession()).accessToken)
# 예상: undefined ✅

# Backend 로그 (터미널)
# "GET /me" 요청 확인
# "Google 토큰 검증 성공"
```

### 4. /me 엔드포인트 테스트

#### 클라이언트에서 호출
```javascript
// 브라우저 콘솔
const session = await getSession();
console.log(session);

// /me 호출은 백엔드에서 자동 처리됨
```

#### 서버에서 확인
```bash
# Backend 로그에서 확인
# 1. Google 토큰 검증
# 2. DB 사용자 조회
# 3. 신규 사용자 자동 생성 (처음 로그인 시)

# DB 확인
psql -U user -d reservation_db
SELECT id, email, name, role, is_active FROM users;
```

---

## 🛡️ 권한 체크 테스트

### 1. 비로그인 사용자

#### Test 1: Admin 페이지 접근
```bash
# 브라우저: http://localhost:3000/admin
# 예상: 로그인 페이지로 리다이렉트
```

#### Test 2: API 직접 호출
```bash
curl -X GET http://localhost:8000/admin/dashboard
# 예상: {"detail": "인증이 필요합니다."}
# 상태 코드: 401
```

### 2. 일반 사용자 (role=USER)

#### Test 1: 일반 사용자로 로그인
1. Google 로그인
2. DB에서 role 확인
```sql
SELECT email, role FROM users WHERE email = 'user@gmail.com';
-- role이 'USER'인지 확인
```

#### Test 2: Admin 페이지 접근
```bash
# 브라우저: http://localhost:3000/admin
# 예상: 
# 1. "관리자 권한이 필요합니다." 알림
# 2. 홈페이지로 리다이렉트
```

#### Test 3: Admin API 직접 호출
```bash
# Google 토큰 가져오기 (브라우저 콘솔)
const session = await getSession();
// 실제로는 백엔드가 토큰 처리하므로 테스트 어려움

# Backend에서 로그 확인
# "403 Forbidden: 관리자 권한이 필요합니다."
```

### 3. 관리자 (role=ADMIN)

#### Test 1: 관리자로 변경
```sql
-- DB에서 사용자를 관리자로 변경
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'your-email@gmail.com';

-- 확인
SELECT email, role FROM users WHERE email = 'your-email@gmail.com';
```

#### Test 2: 재로그인
```bash
# 브라우저에서 로그아웃 후 다시 로그인
# signIn 콜백에서 DB 사용자 정보 확인
```

#### Test 3: Admin 페이지 접근
```bash
# 브라우저: http://localhost:3000/admin
# 예상: ✅ 정상 접근
# - 대시보드 통계 표시
# - 모든 탭 정상 작동
```

---

## 🎯 Admin 기능 테스트

### 1. Dashboard 탭
```bash
# 브라우저: http://localhost:3000/admin

# 확인사항:
✅ 총 예약 수
✅ 총 주문 수
✅ 총 매출
✅ 총 사용자 수
✅ 총 리뷰 수 및 평균 평점

# Backend 로그:
# "GET /admin/dashboard" 200 OK
```

### 2. 예약 관리 탭
```bash
# "예약 관리" 탭 클릭

# 확인사항:
✅ 예약 목록 표시
✅ 예약 시간, 상태, 메모 표시
✅ 빈 상태 처리 ("예약이 없습니다.")

# Backend 로그:
# "GET /admin/reservations" 200 OK
```

### 3. 주문 관리 탭
```bash
# "주문 관리" 탭 클릭

# 확인사항:
✅ 주문 목록 표시
✅ 주문 번호, 금액, 상태, 결제 방법 표시
✅ 빈 상태 처리

# Backend 로그:
# "GET /admin/orders" 200 OK
```

### 4. 사용자 관리 탭
```bash
# "사용자 관리" 탭 클릭

# 확인사항:
✅ 사용자 목록 표시
✅ 이메일, 이름, 역할 표시
✅ ADMIN 역할 강조 표시
✅ 활성 상태 표시

# Backend 로그:
# "GET /admin/users" 200 OK
```

### 5. 상품 관리 탭

#### Test 1: 상품 추가
```bash
# "상품 관리" 탭 → "상품 추가" 버튼 클릭

# 입력:
상품명: 테스트 상품
설명: 테스트 설명
가격: 10.00

# "저장" 클릭

# 확인:
✅ 상품 목록에 추가됨
✅ Backend: "POST /admin/products" 200 OK
```

#### Test 2: 상품 수정
```bash
# 상품 카드에서 "수정" 버튼 클릭

# 수정:
가격: 15.00

# "저장" 클릭

# 확인:
✅ 가격 업데이트됨
✅ Backend: "PATCH /admin/products/{id}" 200 OK
```

#### Test 3: 상품 삭제
```bash
# 상품 카드에서 "삭제" 버튼 클릭

# 확인 다이얼로그: "정말 삭제하시겠습니까?"
# "확인" 클릭

# 확인:
✅ 상품 목록에서 제거됨
✅ Backend: "DELETE /admin/products/{id}" 200 OK
✅ DB: is_active = FALSE
```

---

## 🔒 보안 테스트

### 1. 환경변수 검증 테스트

#### Test 1: SECRET_KEY 없이 시작
```bash
cd backend
unset SECRET_KEY
python -m uvicorn main:app

# 예상 에러:
# ValueError: SECRET_KEY 환경변수가 설정되지 않았습니다.
```

#### Test 2: 짧은 SECRET_KEY
```bash
export SECRET_KEY="short"
python -m uvicorn main:app

# 예상 에러:
# ValueError: SECRET_KEY는 최소 32자 이상이어야 합니다.
```

#### Test 3: 취약한 SECRET_KEY (프로덕션)
```bash
export ENVIRONMENT=production
export SECRET_KEY="changeme-secret-key-12345678901234567"
python -m uvicorn main:app

# 예상 에러:
# ValueError: 프로덕션 환경에서 취약한 SECRET_KEY를 사용할 수 없습니다.
```

### 2. CORS 테스트

#### Test 1: 프로덕션에서 CORS "*"
```bash
export ENVIRONMENT=production
export ALLOWED_ORIGINS="*"
python -m uvicorn main:app

# 예상 에러:
# ValueError: 프로덕션 환경에서 ALLOWED_ORIGINS=*는 허용되지 않습니다.
```

#### Test 2: HTTP origin (프로덕션)
```bash
export ENVIRONMENT=production
export ALLOWED_ORIGINS="http://example.com"
python -m uvicorn main:app

# 예상 에러:
# ValueError: 프로덕션 환경에서는 HTTPS origin만 허용됩니다
```

### 3. 토큰 검증 테스트

#### Test 1: 잘못된 토큰
```bash
curl -X GET http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer invalid_token"

# 예상 응답:
# {"detail": "인증이 만료되었습니다."}
# 상태: 401
```

#### Test 2: 토큰 없음
```bash
curl -X GET http://localhost:8000/admin/dashboard

# 예상 응답:
# {"detail": "인증이 필요합니다."}
# 상태: 401
```

#### Test 3: 만료된 토큰
```bash
# 오래된 토큰으로 요청 (1시간 이상)
# Google access_token은 1시간 유효

# 예상 응답:
# {"detail": "인증이 만료되었습니다."}
# 상태: 401
```

### 4. 세션 보안 테스트

#### Test 1: accessToken 노출 확인
```javascript
// 브라우저 콘솔
const session = await getSession();
console.log(session);

// 확인:
✅ session.user = { id, email, name }
✅ session.accessToken = undefined (노출 안됨)
```

#### Test 2: 세션 타임아웃
```javascript
// 로그인 후 24시간 대기 (또는 서버 시간 조작)

// 다시 /admin 접속
// 예상: 로그인 페이지로 리다이렉트
```

---

## 🐛 트러블슈팅

### 문제 1: "인증이 필요합니다" 에러

**원인:**
- Google OAuth 토큰이 전달되지 않음
- NextAuth 세션 문제

**해결:**
```bash
# 1. 로그아웃 후 다시 로그인
# 2. 브라우저 쿠키 확인
document.cookie

# 3. NextAuth 세션 확인
await getSession()

# 4. Backend 로그 확인
# "Authorization" 헤더가 전달되는지 확인
```

### 문제 2: "관리자 권한이 필요합니다" 에러

**원인:**
- DB에서 role이 'USER'임

**해결:**
```sql
-- DB에서 역할 변경
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'your-email@gmail.com';

-- 확인
SELECT email, role FROM users WHERE email = 'your-email@gmail.com';
```

### 문제 3: "등록되지 않은 사용자입니다" 에러

**원인:**
- signIn 콜백에서 /me 호출 실패
- DB 연결 문제

**해결:**
```bash
# 1. Backend 로그 확인
# "GET /me" 요청이 들어오는지

# 2. DB 연결 확인
psql -U user -d reservation_db

# 3. 수동으로 사용자 추가
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES ('your-email@gmail.com', '', 'Your Name', 'ADMIN', TRUE);
```

### 문제 4: CORS 에러

**원인:**
- Backend ALLOWED_ORIGINS 설정 문제

**해결:**
```bash
# .env 확인
cat backend/.env
# ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Backend 재시작
python -m uvicorn main:app --reload
```

### 문제 5: 환경변수 에러

**원인:**
- .env 파일 누락 또는 잘못된 값

**해결:**
```bash
# Backend
cd backend
cp env.example.txt .env
# SECRET_KEY 재생성 및 설정

# Frontend
cd frontend
cp env.example.txt .env.local
# NEXTAUTH_SECRET 재생성 및 설정
```

---

## ✅ 전체 체크리스트

### 환경 설정
- [ ] PostgreSQL 실행 중
- [ ] Backend .env 설정 완료
- [ ] Frontend .env.local 설정 완료
- [ ] Google OAuth 설정 완료

### 데이터베이스
- [ ] 테이블 생성 완료
- [ ] 관리자 계정 생성 완료
- [ ] DB 연결 테스트 완료

### 로그인
- [ ] Google 로그인 성공
- [ ] 세션 생성 확인
- [ ] /me 엔드포인트 동작 확인
- [ ] 신규 사용자 자동 생성 확인

### 권한 체크
- [ ] 비로그인 사용자 차단 확인
- [ ] 일반 사용자 admin 접근 차단 확인
- [ ] 관리자 admin 접근 허용 확인

### Admin 기능
- [ ] Dashboard 통계 표시
- [ ] 예약 목록 표시
- [ ] 주문 목록 표시
- [ ] 사용자 목록 표시
- [ ] 상품 추가 기능
- [ ] 상품 수정 기능
- [ ] 상품 삭제 기능

### 보안
- [ ] accessToken 세션에서 제거 확인
- [ ] 환경변수 검증 동작 확인
- [ ] CORS 설정 적용 확인
- [ ] 토큰 검증 동작 확인
- [ ] 세션 타임아웃 설정 확인

---

## 📊 성공 기준

### ✅ 필수 기능
1. **로그인**: Google OAuth로 정상 로그인
2. **권한 체크**: 관리자만 admin 페이지 접근
3. **데이터 로딩**: 모든 탭에서 데이터 정상 표시
4. **CRUD**: 상품 추가/수정/삭제 정상 작동

### ✅ 보안 요구사항
1. **환경변수**: 모든 필수 변수 설정 및 검증
2. **토큰 보안**: accessToken 세션에서 제거
3. **CORS**: 적절한 도메인만 허용
4. **에러 처리**: 사용자 친화적 메시지

### ✅ 성능 요구사항
1. **API 응답**: 2초 이내
2. **페이지 로딩**: 3초 이내
3. **데이터베이스**: 쿼리 최적화

---

**마지막 업데이트**: 2026-01-29  
**버전**: 1.0.0  
**테스트 담당**: QA Team
