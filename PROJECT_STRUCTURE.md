# 🏗️ 프로젝트 전체 구조

## 📋 개요

**Rover 스타일 반려견 서비스** - 예약·리뷰·갤러리·쇼핑 통합 플랫폼

---

## 🛠️ 기술 스택

### 프론트엔드
- **Next.js 16.1.1** (App Router)
- **React 19.2.3**
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma** (ORM)
- **PWA 지원**

### 백엔드
- **Next.js API Routes** (서버리스 함수)
- **Prisma Client** (데이터베이스 접근)
- **FastAPI** (Python, 선택적 사용)

### 데이터베이스
- **PostgreSQL (Neon)** - 클라우드 데이터베이스
- **Prisma** - ORM 및 마이그레이션 관리

### 배포
- **Vercel** - 프론트엔드 및 API Routes 배포
- **Neon** - PostgreSQL 데이터베이스 호스팅

---

## 📁 프로젝트 구조

```
Cursor/
├── frontend/                    # Next.js 프론트엔드
│   ├── prisma/                  # Prisma 설정
│   │   └── schema.prisma        # 데이터베이스 스키마
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── api/             # API Routes (서버리스 함수)
│   │   │   │   ├── health/      # 헬스 체크
│   │   │   │   ├── users/       # 사용자 API
│   │   │   │   ├── products/    # 상품 API
│   │   │   │   └── reservations/# 예약 API
│   │   │   ├── admin/           # 관리자 페이지
│   │   │   ├── gallery/         # 갤러리 페이지
│   │   │   ├── login/           # 로그인 페이지
│   │   │   ├── register/        # 회원가입 페이지
│   │   │   ├── reservations/    # 예약 페이지
│   │   │   ├── reviews/         # 리뷰 페이지
│   │   │   ├── shop/            # 쇼핑 페이지
│   │   │   ├── layout.tsx       # 루트 레이아웃
│   │   │   └── page.tsx         # 홈 페이지
│   │   ├── components/          # React 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── PWAInstaller.tsx
│   │   └── lib/                 # 유틸리티
│   │       ├── prisma.ts        # Prisma Client 인스턴스
│   │       ├── api.ts           # API 클라이언트 (FastAPI용)
│   │       └── sw-register.ts  # Service Worker 등록
│   ├── public/                  # 정적 파일
│   │   ├── sw.js               # Service Worker
│   │   └── manifest.json       # PWA 매니페스트
│   ├── .env.local              # 환경 변수 (Neon URL 등)
│   ├── package.json
│   └── next.config.ts
│
├── backend/                     # FastAPI 백엔드 (선택적)
│   ├── routers/                # API 라우터
│   ├── models.py               # SQLAlchemy 모델
│   ├── schemas.py              # Pydantic 스키마
│   ├── database.py             # 데이터베이스 연결
│   ├── auth.py                 # 인증 유틸리티
│   ├── init_db.py              # DB 초기화
│   └── seed_data.py            # 샘플 데이터
│
└── README.md                    # 프로젝트 설명
```

---

## 🗄️ 데이터베이스 구조

### 테이블 목록

1. **users** - 사용자 정보
   - `id`, `email`, `passwordHash`, `name`, `phone`, `role`, `isActive`
   - `createdAt`, `modifiedAt`

2. **reservations** - 예약 정보
   - `id`, `userId`, `reservedAt`, `status`, `memo`
   - `createdAt`, `modifiedAt`

3. **products** - 상품 정보
   - `id`, `name`, `description`, `price`, `isActive`
   - `createdAt`, `modifiedAt`

4. **orders** - 주문 정보
   - `id`, `userId`, `totalAmount`, `status`, `paymentMethod`, `paymentStatus`
   - `createdAt`, `modifiedAt`

5. **order_items** - 주문 항목
   - `id`, `orderId`, `productId`, `quantity`, `unitPrice`
   - `createdAt`

6. **reviews** - 리뷰
   - `id`, `userId`, `reservationId`, `orderId`, `rating`, `comment`
   - `createdAt`, `modifiedAt`

7. **gallery** - 갤러리 이미지
   - `id`, `imageUrl`, `caption`, `isActive`
   - `createdAt`, `modifiedAt`

8. **login** - 로그인 로그
   - `id`, `userId`, `loginAt`, `ipAddress`, `userAgent`, `success`, `failureReason`

---

## 🔌 API 엔드포인트

### Next.js API Routes (서버리스)

- `GET /api/health` - 헬스 체크 및 DB 연결 확인
- `GET /api/users` - 사용자 목록 조회
- `GET /api/products` - 상품 목록 조회
- `GET /api/reservations` - 예약 목록 조회

### FastAPI 백엔드 (선택적)

- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /auth/me` - 현재 사용자 정보
- `GET /products` - 상품 목록
- `POST /orders` - 주문 생성
- `GET /reviews` - 리뷰 목록
- `GET /gallery` - 갤러리 목록

---

## ⚙️ 환경 설정

### 1. Neon 데이터베이스 설정

`frontend/.env.local` 파일 생성:

```env
# Neon PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Next.js API Base URL
NEXT_PUBLIC_API_BASE="http://localhost:3000"

# JWT Secret
SECRET_KEY="your-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 2. Prisma 설정

```bash
cd frontend
npx prisma generate          # Prisma Client 생성
npx prisma db push           # 스키마를 DB에 적용
npx prisma migrate dev       # 마이그레이션 생성 및 적용
```

### 3. 데이터베이스 초기화 (선택적)

FastAPI 백엔드를 사용하는 경우:

```bash
cd backend
python -m backend.init_db --seed
```

---

## 🚀 로컬 실행

### 프론트엔드 (Next.js)

```bash
cd frontend
npm install
npm run dev
```

접속: http://localhost:3000

### 백엔드 (FastAPI, 선택적)

```bash
.\venv\Scripts\activate
uvicorn backend.main:app --reload --port 8000
```

접속: http://localhost:8000/docs

---

## 📦 배포 (Vercel)

### 1. GitHub에 프로젝트 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel 배포

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
5. 환경 변수 추가:
   - `DATABASE_URL`: Neon 데이터베이스 URL
   - `SECRET_KEY`: JWT 시크릿 키
6. "Deploy" 클릭

### 3. Neon 데이터베이스 설정

1. [Neon Console](https://console.neon.tech)에서 프로젝트 생성
2. 데이터베이스 URL 복사
3. Vercel 환경 변수에 `DATABASE_URL` 추가
4. Prisma 마이그레이션 실행:

```bash
npx prisma migrate deploy
```

---

## 🔧 주요 기능

### ✅ 구현 완료
- [x] Next.js App Router 구조
- [x] Prisma ORM 설정
- [x] Neon PostgreSQL 연결
- [x] API Routes (서버리스 함수)
- [x] 사용자 인증 시스템
- [x] 예약 관리
- [x] 상품 관리
- [x] 주문 시스템
- [x] 리뷰 시스템
- [x] 갤러리
- [x] 로그인 로그
- [x] PWA 지원

### 🚧 향후 개선
- [ ] 인증 미들웨어 추가
- [ ] 이미지 업로드 기능
- [ ] 결제 시스템 통합
- [ ] 관리자 대시보드
- [ ] 실시간 알림

---

## 📝 사용 방법

### Prisma 명령어

```bash
# Prisma Client 생성
npx prisma generate

# 스키마 변경사항을 DB에 적용
npx prisma db push

# 마이그레이션 생성
npx prisma migrate dev --name migration_name

# 데이터베이스 스키마 확인
npx prisma studio
```

### API 사용 예시

```typescript
// Next.js API Route에서 Prisma 사용
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany()
  return Response.json(users)
}
```

---

## 🔐 보안 고려사항

1. **환경 변수**: `.env.local` 파일은 절대 커밋하지 않기
2. **비밀번호 해싱**: bcrypt 사용
3. **JWT 토큰**: 안전한 시크릿 키 사용
4. **CORS 설정**: 프로덕션 환경에서 적절히 제한
5. **SQL Injection**: Prisma가 자동으로 방어

---

## 📚 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Prisma 문서](https://www.prisma.io/docs)
- [Neon 문서](https://neon.tech/docs)
- [Vercel 문서](https://vercel.com/docs)

---

## 🎯 아키텍처 다이어그램

```
┌─────────────────┐
│   브라우저      │
│  (Next.js App)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│  Routes (Vercel)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prisma Client  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Neon PostgreSQL│
│   (Database)    │
└─────────────────┘
```

---

**마지막 업데이트**: 2025-12-30









