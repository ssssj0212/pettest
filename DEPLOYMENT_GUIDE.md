# 배포 가이드

## 🚀 빠른 시작

### 로컬 개발
프론트엔드만 실행하면 백엔드도 자동으로 함께 실행됩니다:

```bash
cd frontend
npm run dev
```

이제 `http://localhost:3000`에서 프론트엔드와 `http://localhost:8000`에서 백엔드가 함께 실행됩니다.

## 📦 GitHub 배포

### 1. Vercel에 프론트엔드 배포 (추천)

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 연결**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - Root Directory를 `frontend`로 설정
   - Framework Preset: Next.js

3. **환경 변수 설정**
   - Vercel 프로젝트 설정 → Environment Variables
   - `NEXT_PUBLIC_API_BASE` 추가
   - 값: 백엔드 URL (예: `https://your-backend.railway.app`)

4. **배포**
   - "Deploy" 클릭
   - 자동으로 배포가 시작됩니다

### 2. Railway에 백엔드 배포

1. **Railway 계정 생성**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - "New Project" → "Deploy from GitHub repo"
   - 저장소 선택
   - Root Directory를 `backend`로 설정

3. **환경 변수 설정**
   - Settings → Variables
   - 필요한 환경 변수 추가:
     - `DATABASE_URL` (PostgreSQL 연결 문자열)
     - `ALLOWED_ORIGINS` (프론트엔드 URL, 예: `https://your-app.vercel.app`)

4. **배포**
   - 자동으로 배포가 시작됩니다
   - 배포 후 생성된 URL을 프론트엔드의 `NEXT_PUBLIC_API_BASE`에 설정

### 3. Render에 백엔드 배포 (대안)

1. **Render 계정 생성**
   - https://render.com 접속
   - GitHub 계정으로 로그인

2. **Web Service 생성**
   - "New" → "Web Service"
   - GitHub 저장소 연결
   - 설정:
     - Name: `your-backend-name`
     - Root Directory: `backend`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

3. **환경 변수 설정**
   - Environment Variables 섹션에서 추가

## 🔗 URL 연결

### 프론트엔드에서 백엔드 연결

1. **Vercel 환경 변수 설정**
   ```
   NEXT_PUBLIC_API_BASE=https://your-backend.railway.app
   ```

2. **로컬 개발용**
   - `frontend/.env.local` 파일 생성:
   ```
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```

### CORS 설정

백엔드의 `backend/main.py`에서 CORS 설정 확인:

```python
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
```

프로덕션에서는:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

## 📝 GitHub Actions 자동 배포

`.github/workflows/deploy.yml` 파일이 이미 생성되어 있습니다.

### Vercel 토큰 설정

1. Vercel 대시보드 → Settings → Tokens
2. 새 토큰 생성
3. GitHub 저장소 → Settings → Secrets → Actions
4. 다음 Secrets 추가:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `NEXT_PUBLIC_API_BASE`

## 🎯 배포 후 확인

1. 프론트엔드 URL 접속
2. 브라우저 콘솔에서 API 연결 확인
3. 로그인/회원가입 테스트
4. 백엔드 Health Check: `https://your-backend-url/health`

## 💡 팁

- **무료 호스팅 옵션**:
  - 프론트엔드: Vercel (무료)
  - 백엔드: Railway (무료 티어), Render (무료 티어)
  
- **데이터베이스**:
  - Railway: PostgreSQL 자동 제공
  - Render: PostgreSQL 추가 가능
  - Neon: https://neon.tech (무료 PostgreSQL)

- **도메인 연결**:
  - Vercel과 Railway 모두 커스텀 도메인 지원













