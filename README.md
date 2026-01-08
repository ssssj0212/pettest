# Rover-Style 반려견 서비스

반응형 웹 기반의 예약/리뷰/갤러리/쇼핑 통합 서비스 (Rover.com 스타일)

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **백엔드**: FastAPI, Python 3.14+
- **데이터베이스**: PostgreSQL (Neon)
- **인증**: JWT (python-jose, passlib)

## 주요 기능

- ✅ 회원가입/로그인 (JWT 인증, ADMIN/USER 역할)
- ✅ 예약 관리 (달력 뷰, 생성/조회/변경/취소)
- ✅ 리뷰 작성/조회
- ✅ 갤러리 이미지 관리
- ✅ 상품 판매 및 주문
- ✅ 결제 시스템 (카드/Venmo/현금 옵션)
- ✅ 관리자 대시보드
- ✅ PWA 지원 (앱 설치 가능)
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)

## 설치 및 실행

### 1. 환경 설정

#### 백엔드
```bash
# 가상환경 생성 및 활성화
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 패키지 설치
pip install -r backend/requirements.txt

# 환경변수 설정 (.env 파일 생성)
# backend/.env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dbname
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:3000
```

#### 프론트엔드
```bash
cd frontend
npm install

# 환경변수 설정 (.env 파일 생성)
# frontend/.env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### 2. 데이터베이스 초기화

```bash
# 가상환경 활성화 후
python -m backend.init_db
```

### 3. 서버 실행

#### 🚀 자동 실행 (추천)
프론트엔드만 실행하면 백엔드도 자동으로 함께 실행됩니다:

```bash
cd frontend
npm run dev
```

이제 두 서버가 자동으로 시작됩니다:
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000

#### 수동 실행
각각 따로 실행하려면:

**백엔드:**
```bash
.\venv\Scripts\activate
uvicorn backend.main:app --reload --port 8000
```

**프론트엔드:**
```bash
cd frontend
npm run dev:frontend
```

### 4. 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API 문서: http://localhost:8000/docs
- 백엔드 Health Check: http://localhost:8000/health

## 테스트

```bash
# 스모크 테스트 실행
python backend/test_api.py

# 또는 pytest 사용
pytest backend/test_api.py -v
```

## 프로젝트 구조

```
.
├── backend/
│   ├── routers/          # API 라우터 모듈
│   │   ├── auth.py       # 인증
│   │   ├── reservations.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   ├── reviews.py
│   │   ├── gallery.py
│   │   └── admin.py
│   ├── models.py         # SQLAlchemy 모델
│   ├── schemas.py         # Pydantic 스키마
│   ├── auth.py           # JWT 인증 유틸리티
│   ├── database.py       # DB 연결
│   ├── main.py           # FastAPI 앱
│   └── init_db.py        # DB 초기화
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router 페이지
│   │   ├── components/    # React 컴포넌트
│   │   └── lib/           # 유틸리티 (API 클라이언트)
│   └── package.json
└── README.md
```

## API 엔드포인트

### 인증
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /auth/me` - 현재 사용자 정보

### 예약
- `GET /reservations` - 예약 목록
- `POST /reservations` - 예약 생성
- `GET /reservations/{id}` - 예약 상세
- `PATCH /reservations/{id}` - 예약 변경
- `DELETE /reservations/{id}` - 예약 취소
- `GET /reservations/calendar` - 달력 요약

### 상품/주문
- `GET /products` - 상품 목록
- `GET /products/{id}` - 상품 상세
- `POST /orders` - 주문 생성
- `GET /orders` - 주문 목록
- `POST /orders/{id}/payment` - 결제 처리

### 리뷰/갤러리
- `GET /reviews` - 리뷰 목록
- `POST /reviews` - 리뷰 작성
- `GET /gallery` - 갤러리 목록
- `POST /gallery` - 갤러리 추가 (관리자만)

### 관리자
- `GET /admin/dashboard` - 대시보드 통계
- `GET /admin/reservations` - 모든 예약
- `GET /admin/orders` - 모든 주문
- `GET /admin/users` - 모든 사용자
- `POST /admin/products` - 상품 생성
- `PATCH /admin/products/{id}` - 상품 수정
- `DELETE /admin/products/{id}` - 상품 삭제

## 배포

### 🚀 GitHub 배포 가이드

자세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

#### 빠른 배포

**프론트엔드 (Vercel):**
1. https://vercel.com 에서 GitHub 저장소 연결
2. Root Directory: `frontend` 설정
3. 환경 변수: `NEXT_PUBLIC_API_BASE` 추가
4. 자동 배포 완료!

**백엔드 (Railway/Render):**
1. https://railway.app 또는 https://render.com 에서 GitHub 저장소 연결
2. Root Directory: `backend` 설정
3. 환경 변수 설정 (DATABASE_URL, ALLOWED_ORIGINS 등)
4. 자동 배포 완료!

### 수동 배포

**백엔드:**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

**프론트엔드:**
```bash
npm run build
npm start
```

## 라이선스

MIT

