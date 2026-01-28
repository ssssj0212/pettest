# 🗄️ 데이터베이스 연결 정보 가이드

## 📋 개요

이 프로젝트는 **PostgreSQL** 데이터베이스를 사용하며, 두 가지 방식으로 연결합니다:

1. **프론트엔드 (Next.js + Prisma)**: `postgresql://` 형식
2. **백엔드 (FastAPI + SQLAlchemy)**: `postgresql+psycopg://` 형식

---

## 🔧 연결 정보 설정 위치

### 1️⃣ 프론트엔드 (Next.js + Prisma)

**파일 위치**: `frontend/.env.local` (생성 필요)

**환경 변수**:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
```

**사용 위치**:
- `frontend/prisma/schema.prisma` - Prisma 스키마에서 읽음
- `frontend/src/lib/prisma.ts` - Prisma Client 초기화 시 사용
- `frontend/src/app/api/*/route.ts` - Next.js API Routes에서 사용

**예시 (Neon Cloud)**:
```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**예시 (로컬 PostgreSQL)**:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/reservation_db"
```

---

### 2️⃣ 백엔드 (FastAPI + SQLAlchemy)

**파일 위치**: `backend/.env` (생성 필요) 또는 환경 변수

**환경 변수**:
```env
DATABASE_URL="postgresql+psycopg://user:password@host:port/dbname"
```

**사용 위치**:
- `backend/database.py` - SQLAlchemy 엔진 생성 시 사용
- `backend/models.py` - 모델 정의
- `backend/routers/*.py` - 모든 API 라우터에서 사용

**예시 (Neon Cloud)**:
```env
DATABASE_URL="postgresql+psycopg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**예시 (로컬 PostgreSQL)**:
```env
DATABASE_URL="postgresql+psycopg://postgres:password@localhost:5432/reservation_db"
```

---

## 📝 연결 URL 형식 차이점

### Prisma (프론트엔드)
```
postgresql://user:password@host:port/dbname?sslmode=require
```
- **프로토콜**: `postgresql://`
- **SSL 모드**: `?sslmode=require` (Neon 등 클라우드 DB 필수)

### SQLAlchemy (백엔드)
```
postgresql+psycopg://user:password@host:port/dbname
```
- **프로토콜**: `postgresql+psycopg://` (psycopg 드라이버 사용)
- **SSL 모드**: 필요시 `?sslmode=require` 추가

---

## 🚀 설정 방법

### 1. Neon Cloud 데이터베이스 사용 (권장)

#### Step 1: Neon에서 데이터베이스 생성
1. [Neon Console](https://console.neon.tech) 접속
2. "Create Project" 클릭
3. 프로젝트 이름 입력 및 생성
4. **Connection String** 복사

#### Step 2: 프론트엔드 설정
```bash
# frontend/.env.local 파일 생성
cd frontend
```

`frontend/.env.local` 파일 내용:
```env
# Neon PostgreSQL (Prisma용)
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# FastAPI 서버 주소 (선택적)
NEXT_PUBLIC_API_BASE="http://localhost:8000"

# JWT 시크릿 키
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### Step 3: 백엔드 설정
```bash
# backend/.env 파일 생성
cd backend
```

`backend/.env` 파일 내용:
```env
# Neon PostgreSQL (SQLAlchemy용)
# 주의: postgresql+psycopg:// 형식 사용
DATABASE_URL="postgresql+psycopg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# JWT 설정
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS 설정
ALLOWED_ORIGINS="http://localhost:3000"
```

#### Step 4: Prisma 마이그레이션
```bash
cd frontend
npm run prisma:generate    # Prisma Client 생성
npm run prisma:push        # 스키마를 DB에 적용
```

---

### 2. 로컬 PostgreSQL 데이터베이스 사용

#### Step 1: PostgreSQL 설치 및 실행
```bash
# PostgreSQL 설치 (이미 설치되어 있다면 생략)
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql
```

#### Step 2: 데이터베이스 생성
```sql
-- PostgreSQL에 접속 후
CREATE DATABASE reservation_db;
CREATE USER reservation_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE reservation_db TO reservation_user;
```

#### Step 3: 프론트엔드 설정
`frontend/.env.local`:
```env
DATABASE_URL="postgresql://reservation_user:your_password@localhost:5432/reservation_db"
NEXT_PUBLIC_API_BASE="http://localhost:8000"
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### Step 4: 백엔드 설정
`backend/.env`:
```env
DATABASE_URL="postgresql+psycopg://reservation_user:your_password@localhost:5432/reservation_db"
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS="http://localhost:3000"
```

---

## 🔍 현재 연결 정보 확인 방법

### 프론트엔드 (Prisma)
```bash
cd frontend
npm run prisma:studio
# 브라우저에서 데이터베이스 내용 확인 가능
```

또는 코드에서:
```typescript
// frontend/src/app/api/health/route.ts
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$connect()
    // 연결 성공
    return Response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    // 연결 실패
    return Response.json({ status: 'error', error: error.message })
  }
}
```

### 백엔드 (SQLAlchemy)
```bash
# 가상환경 활성화 후
.\venv\Scripts\activate
python -c "from backend.database import engine; print(engine.url)"
```

또는 API 테스트:
```bash
curl http://localhost:8000/health
```

---

## ⚠️ 주의사항

### 1. 환경 변수 파일 보안
- `.env` 파일은 **절대 Git에 커밋하지 마세요**
- `.gitignore`에 포함되어 있는지 확인:
  ```
  .env
  .env.local
  .env.*.local
  ```

### 2. URL 형식 차이
- **Prisma**: `postgresql://` (슬래시 2개)
- **SQLAlchemy**: `postgresql+psycopg://` (플러스 기호 사용)

### 3. SSL 모드
- **Neon Cloud**: `?sslmode=require` 필수
- **로컬 PostgreSQL**: 일반적으로 불필요

### 4. 동일한 데이터베이스 사용
프론트엔드와 백엔드가 **같은 데이터베이스**를 사용하더라도:
- URL 형식이 다를 수 있음 (Prisma vs SQLAlchemy)
- 하지만 **호스트, 포트, 데이터베이스 이름은 동일**해야 함

---

## 🧪 연결 테스트

### 프론트엔드 연결 테스트
```bash
cd frontend
npm run dev
# 브라우저에서 http://localhost:3000/api/health 접속
# {"status":"ok","database":"connected"} 응답 확인
```

### 백엔드 연결 테스트
```bash
.\venv\Scripts\activate
uvicorn backend.main:app --reload
# 브라우저에서 http://localhost:8000/health 접속
# {"status":"ok"} 응답 확인
```

### 데이터베이스 직접 테스트
```bash
# psql 사용 (PostgreSQL 클라이언트)
psql "postgresql://user:password@host:port/dbname"

# 또는 Neon의 경우
psql "postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

---

## 📚 참고 자료

- [Prisma 데이터베이스 연결](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [SQLAlchemy 연결 문자열](https://docs.sqlalchemy.org/en/20/core/engines.html#postgresql)
- [Neon 데이터베이스 문서](https://neon.tech/docs)
- [PostgreSQL 연결 문자열 형식](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

## 🔧 문제 해결

### 연결 실패 시 확인 사항

1. **환경 변수 확인**
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL
   
   # Linux/Mac
   echo $DATABASE_URL
   ```

2. **데이터베이스 서버 실행 확인**
   ```bash
   # 로컬 PostgreSQL인 경우
   # Windows: 서비스 관리자에서 PostgreSQL 서비스 확인
   # Linux: sudo systemctl status postgresql
   ```

3. **방화벽/네트워크 확인**
   - 로컬: localhost:5432 포트 열려있는지 확인
   - 클라우드: Neon Console에서 연결 정보 확인

4. **인증 정보 확인**
   - 사용자 이름, 비밀번호가 올바른지 확인
   - 데이터베이스 이름이 존재하는지 확인

5. **Prisma 재생성**
   ```bash
   cd frontend
   npm run prisma:generate
   npm run prisma:push
   ```

---

**마지막 업데이트**: 2025-01-29


















