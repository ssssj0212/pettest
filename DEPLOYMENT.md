# 🚀 배포 가이드

## Vercel + Neon 배포 단계별 가이드

### 1️⃣ Neon 데이터베이스 설정

1. [Neon Console](https://console.neon.tech) 접속
2. "Create Project" 클릭
3. 프로젝트 이름 입력 및 생성
4. **Connection String** 복사
   - 형식: `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`

### 2️⃣ 로컬 환경 설정

`frontend/.env.local` 파일 생성:

```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
NEXT_PUBLIC_API_BASE="http://localhost:3000"
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3️⃣ Prisma 마이그레이션

```bash
cd frontend

# Prisma Client 생성
npm run prisma:generate

# 데이터베이스에 스키마 적용
npm run prisma:push

# 또는 마이그레이션 사용
npm run prisma:migrate
```

### 4️⃣ GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 5️⃣ Vercel 배포

1. [Vercel](https://vercel.com) 접속 및 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. **Environment Variables** 추가:
   - `DATABASE_URL`: Neon 데이터베이스 URL
   - `SECRET_KEY`: JWT 시크릿 키
   - `NEXT_PUBLIC_API_BASE`: 배포된 URL (자동 설정됨)
6. "Deploy" 클릭

### 6️⃣ 프로덕션 마이그레이션

배포 후 Vercel 콘솔에서:

```bash
npx prisma migrate deploy
```

또는 Vercel Build Command에 추가:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## ✅ 배포 확인

1. Vercel 대시보드에서 배포 상태 확인
2. 배포된 URL 접속: `https://your-project.vercel.app`
3. API 테스트: `https://your-project.vercel.app/api/health`

---

## 🔧 문제 해결

### 데이터베이스 연결 실패

- Neon Console에서 데이터베이스가 활성화되어 있는지 확인
- `DATABASE_URL` 환경 변수가 올바른지 확인
- SSL 모드가 `require`로 설정되어 있는지 확인

### Prisma 오류

```bash
# Prisma Client 재생성
npm run prisma:generate

# 스키마 재적용
npm run prisma:push
```

### 빌드 실패

- Vercel 로그 확인
- 환경 변수 누락 확인
- Node.js 버전 확인 (18.x 이상 권장)

---

## 💰 비용

### 무료 티어

- **Vercel**: 무료 (개인 프로젝트)
- **Neon**: 무료 (월 0.5GB 스토리지)

### 유료 플랜 (필요시)

- **Vercel Pro**: $20/월
- **Neon Pro**: $19/월

---

**배포 완료 후**: 프로젝트가 라이브 URL에서 실행됩니다! 🎉






