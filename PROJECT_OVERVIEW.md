# 🎯 프로젝트 전체 구조 개요

**Rover 스타일 반려견 서비스** - 예약·리뷰·갤러리·쇼핑 통합 플랫폼

---

## 📊 시스템 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                      🌐 브라우저 (사용자)                    │
│                   http://localhost:3000                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  🎨 프론트엔드 (Frontend)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js 16 App Router (React 19 + TypeScript)      │  │
│  │  - 페이지: /login, /register, /reservations, etc    │  │
│  │  - 컴포넌트: Header, LoadingSpinner, ErrorBoundary  │  │
│  │  - 스타일: Tailwind CSS 4                           │  │
│  └──────────────────────────────────────────────────────┘  │
└───────┬───────────────────────────┬─────────────────────────┘
        │                           │
        │ 방식 1                    │ 방식 2
        │ (주로 사용)               │ (선택적 사용)
        ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Next.js API Routes  │  │   FastAPI 백엔드     │
│  (서버리스 함수)     │  │   (별도 서버)        │
│  /api/*              │  │   localhost:8000     │
│  ┌────────────────┐  │  │   ┌──────────────┐  │
│  │ /api/health    │  │  │   │ /auth/*      │  │
│  │ /api/users     │  │  │   │ /products    │  │
│  │ /api/products  │  │  │   │ /orders      │  │
│  │ /api/reserv... │  │  │   │ /reviews     │  │
│  └────────────────┘  │  │   │ /gallery     │  │
│        │             │  │   │ /admin/*     │  │
│        │             │  │   └──────────────┘  │
│        │             │  │        │            │
│        ▼             │  │        ▼            │
│  ┌──────────┐        │  │  ┌──────────┐      │
│  │  Prisma  │        │  │  │SQLAlchemy│      │
│  │  Client  │        │  │  │   ORM    │      │
│  └──────────┘        │  │  └──────────┘      │
└──────────┬───────────┘  └─────────┬──────────┘
           │                        │
           │                        │
           └──────────┬─────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   🗄️ PostgreSQL 데이터베이스  │
        │      (Neon Cloud)           │
        │                             │
        │  테이블:                    │
        │  - users                    │
        │  - reservations             │
        │  - products                 │
        │  - orders / order_items     │
        │  - reviews                  │
        │  - gallery                  │
        │  - login (로그)             │
        └─────────────────────────────┘
```

---

## 🎨 프론트엔드 (Frontend)

### 위치
```
frontend/
```

### 기술 스택
- **Next.js 16.1.1** - React 프레임워크 (App Router 사용)
- **React 19.2.3** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS 4** - 스타일링
- **Prisma Client** - 데이터베이스 ORM
- **PWA** - 앱 설치 기능 지원

### 주요 디렉토리 구조
```
frontend/
├── src/
│   ├── app/                    # Next.js 페이지
│   │   ├── page.tsx           # 홈 페이지 (/)
│   │   ├── login/             # 로그인 페이지
│   │   ├── register/          # 회원가입 페이지
│   │   ├── reservations/      # 예약 페이지
│   │   ├── shop/              # 쇼핑 페이지
│   │   ├── reviews/           # 리뷰 페이지
│   │   ├── gallery/           # 갤러리 페이지
│   │   ├── admin/             # 관리자 페이지
│   │   └── api/               # Next.js API Routes
│   │       ├── health/        # 헬스 체크 API
│   │       ├── users/         # 사용자 API
│   │       ├── products/      # 상품 API
│   │       └── reservations/  # 예약 API
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── Header.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── PWAInstaller.tsx
│   └── lib/                   # 유틸리티 함수
│       ├── prisma.ts          # Prisma Client 인스턴스
│       ├── api.ts             # FastAPI 클라이언트 (선택적)
│       └── sw-register.ts     # Service Worker 등록
├── prisma/
│   └── schema.prisma          # 데이터베이스 스키마 정의
└── public/                    # 정적 파일
    ├── sw.js                  # Service Worker
    └── manifest.json          # PWA 매니페스트
```

### 실행 방법
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000 에서 실행
```

---

## ⚙️ 백엔드 (Backend)

### 위치
```
backend/
```

### 기술 스택
- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM (데이터베이스 접근)
- **Pydantic** - 데이터 검증
- **python-jose** - JWT 토큰 생성/검증
- **passlib** - 비밀번호 해싱
- **PostgreSQL** - 데이터베이스 (psycopg2)

### 주요 디렉토리 구조
```
backend/
├── routers/                   # API 라우터 모듈
│   ├── auth.py               # 인증 (회원가입/로그인)
│   ├── reservations.py       # 예약 관리
│   ├── products.py           # 상품 관리
│   ├── orders.py             # 주문 관리
│   ├── reviews.py            # 리뷰 관리
│   ├── gallery.py            # 갤러리 관리
│   └── admin.py              # 관리자 기능
├── models.py                 # SQLAlchemy 데이터베이스 모델
├── schemas.py                # Pydantic 스키마 (API 요청/응답)
├── database.py               # 데이터베이스 연결 설정
├── auth.py                   # JWT 인증 유틸리티
├── main.py                   # FastAPI 애플리케이션 진입점
├── init_db.py                # 데이터베이스 초기화
└── seed_data.py              # 샘플 데이터 삽입
```

### 실행 방법
```bash
# 가상환경 활성화
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 서버 실행
uvicorn backend.main:app --reload --port 8000
# http://localhost:8000 에서 실행
# http://localhost:8000/docs 에서 API 문서 확인
```

### 주요 API 엔드포인트
```
POST   /auth/register          # 회원가입
POST   /auth/login             # 로그인
GET    /auth/me                # 현재 사용자 정보

GET    /reservations           # 예약 목록
POST   /reservations           # 예약 생성
GET    /reservations/{id}      # 예약 상세
PATCH  /reservations/{id}      # 예약 수정
DELETE /reservations/{id}      # 예약 취소

GET    /products               # 상품 목록
GET    /products/{id}          # 상품 상세

POST   /orders                 # 주문 생성
GET    /orders                 # 주문 목록
POST   /orders/{id}/payment    # 결제 처리

GET    /reviews                # 리뷰 목록
POST   /reviews                # 리뷰 작성

GET    /gallery                # 갤러리 목록
POST   /gallery                # 갤러리 추가 (관리자)

GET    /admin/dashboard        # 관리자 대시보드
GET    /admin/reservations     # 모든 예약 조회
GET    /admin/orders           # 모든 주문 조회
GET    /admin/users            # 모든 사용자 조회
```

---

## 🌐 서버 (Server)

### 서버 구조

프로젝트에는 **두 가지 서버 방식**이 있습니다:

#### 1️⃣ Next.js 서버 (메인 - Vercel 배포)
- **형식**: 서버리스 함수 (Serverless Functions)
- **위치**: `frontend/src/app/api/*/route.ts`
- **접근**: `/api/*` 경로로 접근
- **특징**:
  - Vercel에 배포 시 자동으로 서버리스 함수로 실행
  - Prisma를 통해 직접 데이터베이스 접근
  - 별도 서버 실행 불필요 (Next.js 개발 서버와 함께 실행)

#### 2️⃣ FastAPI 서버 (선택적 - 별도 배포 필요)
- **형식**: 독립 실행형 서버
- **위치**: `backend/main.py`
- **접근**: `http://localhost:8000/*` 경로로 접근
- **특징**:
  - 별도 프로세스로 실행 필요 (`uvicorn` 명령어)
  - SQLAlchemy를 통해 데이터베이스 접근
  - Railway, Render, Fly.io 등에 별도 배포 가능

---

## 🔌 API (Application Programming Interface)

### API 구조

#### 📍 Next.js API Routes
**위치**: `frontend/src/app/api/`

**엔드포인트**:
- `GET /api/health` - 헬스 체크 및 데이터베이스 연결 확인
- `GET /api/users` - 사용자 목록 조회
- `GET /api/products` - 상품 목록 조회
- `GET /api/reservations` - 예약 목록 조회

**특징**:
- Prisma Client 사용
- 서버 사이드에서 실행 (클라이언트에 노출되지 않음)
- Vercel 배포 시 서버리스 함수로 자동 변환

**예시 코드**:
```typescript
// frontend/src/app/api/health/route.ts
import { prisma } from '@/lib/prisma'

export async function GET() {
  await prisma.$connect()
  return Response.json({ status: 'ok' })
}
```

#### 📍 FastAPI Backend API
**위치**: `backend/routers/`

**주요 엔드포인트 그룹**:
- `/auth/*` - 인증 관련
- `/reservations/*` - 예약 관리
- `/products/*` - 상품 관리
- `/orders/*` - 주문 관리
- `/reviews/*` - 리뷰 관리
- `/gallery/*` - 갤러리 관리
- `/admin/*` - 관리자 기능

**특징**:
- SQLAlchemy ORM 사용
- JWT 토큰 기반 인증
- 자동 API 문서 생성 (`/docs`)

**프론트엔드에서 호출하는 방법**:
```typescript
// frontend/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export async function login(data: LoginData) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    body: formData
  })
  return res.json()
}
```

---

## 🗄️ 데이터베이스 (Database)

### PostgreSQL (Neon Cloud)

**위치**: Neon 클라우드 서비스

**연결 정보**: `DATABASE_URL` 환경 변수

**ORM 방식**:
1. **Prisma** (프론트엔드/Next.js API Routes에서 사용)
   - 스키마 파일: `frontend/prisma/schema.prisma`
   - 마이그레이션: `npx prisma migrate dev`

2. **SQLAlchemy** (FastAPI 백엔드에서 사용)
   - 모델 파일: `backend/models.py`
   - 초기화: `python -m backend.init_db`

### 데이터베이스 스키마

**주요 테이블**:

1. **users** - 사용자 정보
   - id, email, passwordHash, name, phone, role, isActive

2. **reservations** - 예약 정보
   - id, userId, reservedAt, status, memo

3. **products** - 상품 정보
   - id, name, description, price, isActive

4. **orders** - 주문 정보
   - id, userId, totalAmount, status, paymentMethod, paymentStatus

5. **order_items** - 주문 항목
   - id, orderId, productId, quantity, unitPrice

6. **reviews** - 리뷰
   - id, userId, reservationId, orderId, rating, comment

7. **gallery** - 갤러리 이미지
   - id, imageUrl, caption, isActive

8. **login** - 로그인 로그
   - id, userId, loginAt, ipAddress, userAgent, success

---

## 🔗 연결 구조 상세 설명

### 데이터 흐름

#### 시나리오 1: Next.js API Routes 사용 (권장)

```
사용자 브라우저
    ↓ HTTP 요청
Next.js 페이지 컴포넌트 (예: /reservations/page.tsx)
    ↓ fetch('/api/reservations')
Next.js API Route (frontend/src/app/api/reservations/route.ts)
    ↓ prisma.reservation.findMany()
Prisma Client
    ↓ SQL 쿼리
PostgreSQL (Neon)
    ↓ 데이터 반환
Prisma Client
    ↓ JSON 변환
Next.js API Route
    ↓ Response.json()
Next.js 페이지 컴포넌트
    ↓ React 렌더링
사용자 브라우저 (화면 표시)
```

#### 시나리오 2: FastAPI 백엔드 사용 (선택적)

```
사용자 브라우저
    ↓ HTTP 요청
Next.js 페이지 컴포넌트 (예: /login/page.tsx)
    ↓ login() 함수 호출 (from '@/lib/api')
API 클라이언트 (frontend/src/lib/api.ts)
    ↓ fetch('http://localhost:8000/auth/login')
FastAPI 서버 (backend/main.py)
    ↓ 라우터 (backend/routers/auth.py)
SQLAlchemy Session
    ↓ SQL 쿼리
PostgreSQL (Neon)
    ↓ 데이터 반환
SQLAlchemy Session
    ↓ Pydantic 스키마 변환
FastAPI 라우터
    ↓ JSON 응답
API 클라이언트
    ↓ 토큰 저장 (localStorage)
Next.js 페이지 컴포넌트
    ↓ 상태 업데이트
사용자 브라우저 (화면 표시)
```

---

## 📦 배포 구조

### 배포 플랫폼

#### 프론트엔드 + Next.js API Routes
- **플랫폼**: Vercel
- **배포 방법**: GitHub 연동
- **특징**: 서버리스 함수로 자동 변환
- **데이터베이스**: Neon PostgreSQL (클라우드)

#### FastAPI 백엔드 (선택적)
- **플랫폼**: Railway, Render, Fly.io 등
- **배포 방법**: Docker 또는 직접 배포
- **특징**: 별도 서버 인스턴스 필요
- **데이터베이스**: 동일한 Neon PostgreSQL 사용 가능

### 환경 변수

#### 프론트엔드 (.env.local)
```env
DATABASE_URL="postgresql://..."      # Neon 데이터베이스 URL
NEXT_PUBLIC_API_BASE="http://localhost:8000"  # FastAPI 서버 주소
SECRET_KEY="your-secret-key"         # JWT 시크릿 키
```

#### 백엔드 (.env)
```env
DATABASE_URL="postgresql+psycopg://..."  # Neon 데이터베이스 URL
SECRET_KEY="your-secret-key"             # JWT 시크릿 키
ALLOWED_ORIGINS="http://localhost:3000"  # CORS 허용 도메인
```

---

## 🎯 현재 프로젝트 구성 요약

### ✅ 주요 구성 요소

1. **프론트엔드**: Next.js 16 (React 19, TypeScript, Tailwind CSS)
   - PWA 지원
   - 반응형 디자인

2. **API 서버**: 
   - Next.js API Routes (서버리스) - **주로 사용**
   - FastAPI 백엔드 - **선택적 사용**

3. **데이터베이스**: PostgreSQL (Neon Cloud)
   - Prisma ORM (Next.js에서)
   - SQLAlchemy ORM (FastAPI에서)

4. **인증**: JWT 토큰 기반

5. **배포**: Vercel (프론트엔드)

### 🔄 사용 패턴

- **일반적인 사용**: Next.js API Routes → Prisma → PostgreSQL
- **고급 기능 필요 시**: FastAPI 백엔드 → SQLAlchemy → PostgreSQL

---

## 📝 실행 순서 (로컬 개발)

### 1. 데이터베이스 설정
```bash
# Neon에서 데이터베이스 생성 후 URL 복사
# frontend/.env.local에 DATABASE_URL 설정
```

### 2. 프론트엔드 실행
```bash
cd frontend
npm install
npm run prisma:generate    # Prisma Client 생성
npm run prisma:push        # 스키마 적용
npm run dev                # http://localhost:3000
```

### 3. 백엔드 실행 (선택적)
```bash
.\venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000  # http://localhost:8000
```

---

**마지막 업데이트**: 2025-01-29












