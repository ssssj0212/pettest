# 🔐 NextAuth + Google OAuth 보안 감사 리포트

## 📋 목차
1. [감사 범위](#감사-범위)
2. [발견된 보안 취약점](#발견된-보안-취약점)
3. [환경변수 보안](#환경변수-보안)
4. [코드 레벨 보안](#코드-레벨-보안)
5. [네트워크 보안](#네트워크-보안)
6. [권장 조치사항](#권장-조치사항)

---

## 🎯 감사 범위

### 점검 대상
- ✅ NextAuth 설정 (frontend/src/auth.ts)
- ✅ NextAuth 라우트 핸들러 ([...nextauth]/route.ts)
- ✅ 환경변수 설정 (env.example.txt)
- ✅ Google OAuth 플로우
- ✅ 세션 관리
- ✅ 토큰 저장 및 전송
- ✅ CORS 설정
- ✅ Backend 인증 (auth.py)

### 점검 기준
- OWASP Top 10
- OAuth 2.0 보안 모범 사례
- NextAuth.js 보안 가이드라인
- Google OAuth 보안 정책

---

## 🚨 발견된 보안 취약점

### 1. Critical: 세션에 accessToken 노출
**심각도: 🔴 Critical**  
**CWE-200: Exposure of Sensitive Information**

#### 문제 코드:
```typescript
// frontend/src/auth.ts:44
(session as any).accessToken = (token as any).accessToken
```

```typescript
// frontend/src/auth.ts:31-42
async jwt({ token, user, account }) {
  if (account) {
    token.accessToken = account.access_token;  // ⚠️ 토큰 저장
  }
  // ...
  return token;
}
```

#### 문제점:
1. **클라이언트 사이드 노출**
   - `getSession()`으로 클라이언트에서 접근 가능
   - 브라우저 개발자 도구에서 확인 가능
   - XSS 공격 시 토큰 탈취 위험

2. **토큰 수명 관리 불일치**
   - Google access_token: 1시간 유효
   - NextAuth session: 기본 30일
   - 만료된 토큰으로 API 호출 시 실패

3. **Refresh Token 없음**
   - Access token 만료 시 재로그인 필요

#### 영향:
- 공격자가 세션 토큰 탈취 시 Google API 무단 접근 가능
- 사용자 Google 계정 정보 유출 위험

#### 해결 방안:
```typescript
// ❌ Bad: 세션에 accessToken 노출
async session({ session, token }) {
  (session as any).accessToken = (token as any).accessToken;
  return session;
}

// ✅ Good: 서버 사이드에서만 토큰 사용
async session({ session, token }) {
  // 토큰은 JWT에만 저장 (암호화됨)
  // 클라이언트 세션에는 포함하지 않음
  session.user = {
    id: token.id as string,
    email: token.email as string,
    name: token.name as string,
  };
  return session;
}

// API 호출 시 서버 사이드에서 토큰 가져오기
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const token = session?.accessToken;  // 서버에서만 접근
  // ...
}
```

---

### 2. Critical: NEXTAUTH_SECRET 보안 취약
**심각도: 🔴 Critical**  
**CWE-798: Use of Hard-coded Credentials**

#### 문제:
```bash
# frontend/env.example.txt:8
NEXTAUTH_SECRET=your-nextauth-secret-key-here-min-32-chars
```

#### 문제점:
1. **예제 값이 너무 단순함**
   - 사용자가 그대로 사용할 위험
   - 추측 가능한 패턴

2. **최소 길이만 명시**
   - 32자는 최소 요구사항
   - 복잡도 기준 없음

3. **환경변수 검증 없음**
   - 예제 값 그대로 사용해도 서버 시작됨
   - 프로덕션에서도 취약한 SECRET 사용 가능

#### 영향:
- JWT 토큰 위조 가능
- 세션 하이재킹
- 사용자 계정 무단 접근

#### 해결 방안:
```typescript
// ✅ Good: 환경변수 검증 추가
// frontend/src/auth.ts 상단에 추가
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
  throw new Error(
    "NEXTAUTH_SECRET이 설정되지 않았거나 32자 미만입니다. " +
    "강력한 랜덤 문자열을 설정하세요: openssl rand -base64 32"
  );
}

// 개발 환경에서 취약한 SECRET 경고
if (
  process.env.NODE_ENV === "production" &&
  (NEXTAUTH_SECRET.includes("your-") || 
   NEXTAUTH_SECRET.includes("example") ||
   NEXTAUTH_SECRET.includes("changeme"))
) {
  throw new Error(
    "프로덕션 환경에서 예제 SECRET을 사용할 수 없습니다. " +
    "강력한 랜덤 문자열로 변경하세요."
  );
}
```

```bash
# env.example.txt 개선
NEXTAUTH_SECRET=# openssl rand -base64 32 명령어로 생성하세요
```

---

### 3. High: 백엔드 SECRET_KEY 기본값 취약
**심각도: 🟠 High**  
**CWE-798: Use of Hard-coded Credentials**

#### 문제 코드:
```python
# backend/auth.py:20
SECRET_KEY = os.getenv("SECRET_KEY", "changeme-secret-key")
```

#### 문제점:
1. **기본값이 하드코딩됨**
   - 환경변수 없을 시 "changeme-secret-key" 사용
   - 공개된 기본값

2. **프로덕션에서도 사용 가능**
   - 검증 로직 없음

#### 영향:
- JWT 토큰 위조
- 관리자 권한 획득

#### 해결 방안:
```python
# ✅ Good: 환경변수 필수화
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "SECRET_KEY 환경변수가 설정되지 않았습니다. "
        "강력한 랜덤 문자열을 설정하세요: "
        "python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

if len(SECRET_KEY) < 32:
    raise ValueError("SECRET_KEY는 최소 32자 이상이어야 합니다.")

# 프로덕션에서 취약한 KEY 차단
if os.getenv("ENVIRONMENT") == "production":
    weak_keywords = ["changeme", "secret", "password", "example", "test"]
    if any(kw in SECRET_KEY.lower() for kw in weak_keywords):
        raise ValueError(
            "프로덕션 환경에서 취약한 SECRET_KEY를 사용할 수 없습니다."
        )
```

---

### 4. High: CORS 설정 과도하게 개방적
**심각도: 🟠 High**  
**CWE-942: Overly Permissive Cross-domain Whitelist**

#### 문제 코드:
```python
# backend/main.py:16-22
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")

origins = (
    ["*"]
    if allowed_origins == "*"
    else [o.strip() for o in allowed_origins.split(",")]
)
```

```python
# backend/main.py:24-30
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # ⚠️ credentials + wildcard = 위험!
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 문제점:
1. **기본값이 "*" (모든 도메인 허용)**
   - 환경변수 없을 시 모든 오리진 허용
   - CSRF 공격에 취약

2. **credentials + wildcard 조합**
   - `allow_credentials=True` + `allow_origins=["*"]`
   - 브라우저가 차단하지만 설정 자체가 위험

3. **프로덕션 검증 없음**
   - "*" 설정으로 프로덕션 배포 가능

#### 영향:
- CSRF 공격 가능
- 악의적인 사이트에서 API 호출 가능
- 사용자 인증 정보 유출

#### 해결 방안:
```python
# ✅ Good: CORS 설정 검증
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")

# 프로덕션에서 CORS 필수 설정
if ENVIRONMENT == "production" and not allowed_origins_str:
    raise ValueError(
        "프로덕션 환경에서는 ALLOWED_ORIGINS 환경변수가 필수입니다. "
        "예: ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com"
    )

# "*" 차단 (개발 환경 제외)
if ENVIRONMENT == "production" and allowed_origins_str == "*":
    raise ValueError(
        "프로덕션 환경에서 ALLOWED_ORIGINS=*는 허용되지 않습니다. "
        "명시적인 도메인 목록을 설정하세요."
    )

# 개발 환경 기본값
if not allowed_origins_str:
    allowed_origins_str = "http://localhost:3000,http://127.0.0.1:3000"

origins = [o.strip() for o in allowed_origins_str.split(",")]

# HTTPS 검증 (프로덕션)
if ENVIRONMENT == "production":
    for origin in origins:
        if not origin.startswith("https://"):
            raise ValueError(
                f"프로덕션 환경에서는 HTTPS origin만 허용됩니다: {origin}"
            )

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],  # 명시적으로
    allow_headers=["Content-Type", "Authorization"],  # 필요한 것만
)
```

---

### 5. High: Google OAuth 토큰 검증 불완전
**심각도: 🟠 High**  
**CWE-287: Improper Authentication**

#### 문제 코드:
```python
# backend/auth.py:99-116
def require_google_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    access_token = authorization.split(" ", 1)[1].strip()

    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,  # ✅ 타임아웃 있음
    )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    return r.json()  # ⚠️ 검증 부족
```

#### 문제점:
1. **토큰 발급자 검증 없음**
   - Google이 발급한 토큰인지 확인 안함
   - 다른 OAuth provider 토큰도 통과 가능

2. **토큰 만료 시간 확인 안함**
   - 만료된 토큰도 Google API가 거부할 때까지 사용 가능

3. **응답 데이터 검증 부족**
   - email_verified 확인 안함
   - 필수 필드 존재 여부 확인 안함

4. **에러 메시지 너무 상세**
   - 공격자에게 유용한 정보 제공

#### 해결 방안:
```python
# ✅ Good: 완전한 토큰 검증
import requests
from typing import Optional
from fastapi import Header, HTTPException

def require_google_user(authorization: Optional[str] = Header(None)):
    """Google OAuth Bearer 토큰 완전 검증"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="인증이 필요합니다."  # 덜 상세하게
        )

    access_token = authorization.split(" ", 1)[1].strip()

    try:
        # 1. Google API로 토큰 검증
        r = requests.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",  # tokeninfo 사용
            params={"access_token": access_token},
            timeout=5,
        )

        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")
        
        token_info = r.json()
        
        # 2. 토큰 발급자 확인
        if token_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
        
        # 3. 토큰 대상 확인 (선택적 - CLIENT_ID 검증)
        expected_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if expected_client_id and token_info.get("aud") != expected_client_id:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
        
        # 4. 만료 시간 확인
        expires_in = token_info.get("expires_in", 0)
        if expires_in <= 0:
            raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")
        
        # 5. 사용자 정보 가져오기
        user_r = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )
        
        if user_r.status_code != 200:
            raise HTTPException(status_code=401, detail="사용자 정보를 가져올 수 없습니다.")
        
        user_info = user_r.json()
        
        # 6. 이메일 인증 확인
        if not user_info.get("email_verified", False):
            raise HTTPException(
                status_code=403, 
                detail="인증된 이메일 주소가 필요합니다."
            )
        
        # 7. 필수 필드 확인
        if not user_info.get("email"):
            raise HTTPException(status_code=400, detail="사용자 정보가 불완전합니다.")
        
        return user_info
        
    except requests.RequestException as e:
        # 네트워크 오류 등
        raise HTTPException(
            status_code=503,
            detail="인증 서비스에 연결할 수 없습니다."
        )
```

---

### 6. Medium: 환경변수 검증 누락
**심각도: 🟡 Medium**  
**CWE-1004: Sensitive Cookie Without 'HttpOnly' Flag**

#### 문제:
```typescript
// frontend/src/auth.ts
// 환경변수 검증 없음
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,  // undefined 가능
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  // undefined 가능
    }),
  ],
  // ...
});
```

#### 문제점:
1. **필수 환경변수 누락 시 런타임 에러**
   - 서버 시작은 되지만 로그인 시 실패
   - 명확한 에러 메시지 없음

2. **NEXTAUTH_URL 검증 없음**
   - 잘못된 URL 설정 가능

#### 해결 방안:
```typescript
// ✅ Good: 시작 시 검증
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `다음 환경변수가 설정되지 않았습니다: ${missingVars.join(", ")}\n` +
    `env.example.txt를 참고하여 .env.local 파일을 생성하세요.`
  );
}

// NEXTAUTH_URL 형식 검증
const nextAuthUrl = process.env.NEXTAUTH_URL!;
try {
  new URL(nextAuthUrl);
} catch {
  throw new Error(
    `NEXTAUTH_URL이 올바른 URL 형식이 아닙니다: ${nextAuthUrl}`
  );
}

// 프로덕션에서 HTTPS 검증
if (process.env.NODE_ENV === "production" && !nextAuthUrl.startsWith("https://")) {
  throw new Error(
    "프로덕션 환경에서는 NEXTAUTH_URL이 https://로 시작해야 합니다."
  );
}
```

---

### 7. Medium: 세션 타임아웃 설정 없음
**심각도: 🟡 Medium**  
**CWE-613: Insufficient Session Expiration**

#### 문제:
```typescript
// frontend/src/auth.ts
// 세션 타임아웃 설정 없음
export const { handlers, signIn, signOut, auth } = NextAuth({
  // session 설정 없음 (기본값 사용)
  // 기본 maxAge: 30일
});
```

#### 문제점:
1. **세션이 너무 오래 유지됨**
   - 30일간 유효
   - 탈취된 세션 쿠키로 장기간 접근 가능

2. **관리자 세션도 동일**
   - 일반 사용자와 관리자 구분 없음

#### 해결 방안:
```typescript
// ✅ Good: 세션 타임아웃 설정
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [/* ... */],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,  // 1일 (86400초)
    updateAge: 60 * 60,    // 1시간마다 세션 갱신
  },
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",  // 프로덕션에서만 HTTPS
      },
    },
  },
  // ...
});
```

---

### 8. Medium: 에러 메시지 과다 노출
**심각도: 🟡 Medium**  
**CWE-209: Generation of Error Message Containing Sensitive Information**

#### 문제 코드:
```typescript
// frontend/src/lib/api.ts:32-34
if (!res.ok) {
  const text = await res.text().catch(() => '')
  throw new Error(`API ${res.status}: ${text}`)  // ⚠️ 서버 에러 그대로 노출
}
```

#### 문제점:
1. **서버 에러 메시지 클라이언트에 노출**
   - 스택 트레이스 유출 가능
   - 데이터베이스 정보 유출 가능

2. **공격자에게 유용한 정보 제공**

#### 해결 방안:
```typescript
// ✅ Good: 에러 메시지 필터링
async function apiFetch(path: string, init: RequestInit = {}) {
  // ...
  
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = "요청을 처리할 수 없습니다.";
    
    try {
      if (contentType?.includes("application/json")) {
        const errorData = await res.json();
        // 허용된 필드만 사용
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    
    // 개발 환경에서만 상세 정보
    if (process.env.NODE_ENV === "development") {
      console.error(`API Error ${res.status}:`, errorMessage);
    }
    
    throw new Error(errorMessage);
  }
  
  return res;
}
```

---

### 9. Low: signIn 콜백 미구현
**심각도: 🟢 Low**  
**현재는 보안 문제 아님, 향후 잠재적 위험**

#### 문제 코드:
```typescript
// frontend/src/auth.ts:21-29
async signIn({ user, account, profile }) {
  // TODO: FastAPI 백엔드와 연동
  // 예: await fetch(`${BACKEND_URL}/auth/google`, { ... })
  return true;  // ⚠️ 항상 허용
}
```

#### 문제점:
1. **사용자 검증 없음**
   - 모든 Google 계정 허용
   - 특정 도메인만 허용하는 로직 없음

2. **DB 연동 없음**
   - 신규 사용자 자동 생성 안됨
   - 비활성 사용자 차단 안됨

#### 해결 방안:
```typescript
// ✅ Good: signIn 콜백 구현
async signIn({ user, account, profile }) {
  try {
    // 1. 이메일 도메인 제한 (옵션)
    const email = user.email;
    if (!email) return false;
    
    // 특정 도메인만 허용하는 경우
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",") || [];
    if (allowedDomains.length > 0) {
      const domain = email.split("@")[1];
      if (!allowedDomains.includes(domain)) {
        console.warn(`Rejected login from domain: ${domain}`);
        return false;
      }
    }
    
    // 2. 백엔드에 사용자 확인/생성
    const response = await fetch(`${process.env.BACKEND_URL}/auth/google-signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${account?.access_token}`,
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        image: user.image,
      }),
    });
    
    if (!response.ok) {
      console.error("Backend user verification failed");
      return false;
    }
    
    const dbUser = await response.json();
    
    // 3. 비활성 사용자 차단
    if (!dbUser.is_active) {
      console.warn(`Rejected inactive user: ${email}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("signIn callback error:", error);
    return false;
  }
}
```

---

## 🌐 환경변수 보안

### 현재 상태 분석

#### Frontend (env.example.txt)
```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000
BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here-min-32-chars
```

**문제점:**
- ❌ 취약한 예제 값
- ❌ 검증 로직 없음
- ❌ HTTP URL (프로덕션 부적합)
- ❌ PUBLIC_ 접두사 혼동 가능

#### Backend (env.example.txt)
```bash
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/reservation_db
SECRET_KEY=changeme-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:3000
```

**문제점:**
- ❌ 취약한 기본값
- ❌ 검증 없음
- ❌ HTTP URL

### 권장 환경변수 파일

#### ✅ Frontend .env.local (개발)
```bash
# API URLs
NEXT_PUBLIC_API_BASE=http://localhost:8000
BACKEND_URL=http://localhost:8000

# Google OAuth
# https://console.cloud.google.com/apis/credentials 에서 발급
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
# 생성 명령: openssl rand -base64 32
NEXTAUTH_SECRET=생성된_랜덤_문자열_최소_32자

# 선택적: 이메일 도메인 제한
# ALLOWED_EMAIL_DOMAINS=company.com,partner.com
```

#### ✅ Frontend .env.production (Vercel)
```bash
# API URLs
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-client-secret

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=강력한_랜덤_문자열_최소_64자_권장

# Environment
NODE_ENV=production
```

#### ✅ Backend .env (개발)
```bash
# Database
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/reservation_db

# Security
# 생성 명령: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=생성된_랜덤_문자열_최소_32자

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Environment
ENVIRONMENT=development
```

#### ✅ Backend .env (프로덕션)
```bash
# Database (managed service)
DATABASE_URL=postgresql+psycopg://prod_user:강력한비밀번호@prod-db.region.provider.com:5432/prod_db

# Security
SECRET_KEY=강력한_랜덤_문자열_최소_64자_권장

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment
ENVIRONMENT=production

# Google OAuth (선택적: 백엔드에서도 검증 시)
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
```

---

## 🔒 Vercel 환경변수 설정 가이드

### Vercel Dashboard 설정

1. **프로젝트 Settings → Environment Variables**

2. **필수 변수 추가:**

| 변수명 | 값 | 환경 | 비밀 |
|--------|-----|------|------|
| `NEXT_PUBLIC_API_BASE` | `https://api.yourdomain.com` | Production | No |
| `BACKEND_URL` | `https://api.yourdomain.com` | Production | No |
| `GOOGLE_CLIENT_ID` | `[생성된 Client ID]` | Production | No |
| `GOOGLE_CLIENT_SECRET` | `[생성된 Secret]` | Production | **Yes** |
| `NEXTAUTH_URL` | `https://yourdomain.com` | Production | No |
| `NEXTAUTH_SECRET` | `[openssl rand -base64 64]` | Production | **Yes** |

3. **Environment 선택:**
   - ✅ Production
   - ✅ Preview (선택적)
   - ❌ Development (로컬에서 .env.local 사용)

### 보안 체크리스트

- [ ] `GOOGLE_CLIENT_SECRET`를 "Secret" 체크
- [ ] `NEXTAUTH_SECRET`를 "Secret" 체크
- [ ] 모든 URL이 HTTPS로 시작
- [ ] `NEXTAUTH_URL`이 실제 도메인과 일치
- [ ] Google OAuth Redirect URI에 `https://yourdomain.com/api/auth/callback/google` 추가

---

## 🛡️ 코드 레벨 보안 개선

### 1. XSS 방어
```typescript
// ✅ React는 기본적으로 XSS 방어
// 하지만 dangerouslySetInnerHTML 사용 시 주의

// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Good: DOMPurify 사용
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
```

### 2. CSRF 방어
```typescript
// ✅ NextAuth는 기본적으로 CSRF 토큰 사용
// 추가 보호: SameSite 쿠키 설정

cookies: {
  sessionToken: {
    options: {
      sameSite: "lax",  // CSRF 방어
      secure: true,     // HTTPS만
      httpOnly: true,   // JavaScript 접근 차단
    },
  },
}
```

### 3. SQL Injection 방어
```python
# ✅ SQLAlchemy ORM 사용으로 기본 방어됨
# 하지만 raw query 사용 시 주의

# ❌ Bad: raw query with string formatting
db.execute(f"SELECT * FROM users WHERE email = '{email}'")

# ✅ Good: parameterized query
db.execute(
    "SELECT * FROM users WHERE email = :email",
    {"email": email}
)

# ✅ Best: ORM 사용
db.query(User).filter(User.email == email).first()
```

### 4. Rate Limiting
```python
# ✅ Good: 백엔드에 Rate Limiting 추가
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 로그인 엔드포인트에 적용
@app.post("/auth/login")
@limiter.limit("5/minute")  # 1분에 5번만 시도 가능
async def login(request: Request, ...):
    # ...
```

---

## 📊 보안 점수

| 항목 | 현재 점수 | 최대 점수 | 등급 |
|------|-----------|-----------|------|
| 인증/인가 | 4 / 10 | 10 | 🔴 F |
| 세션 관리 | 5 / 10 | 10 | 🟠 D |
| 환경변수 | 3 / 10 | 10 | 🔴 F |
| CORS 설정 | 4 / 10 | 10 | 🔴 F |
| 토큰 보안 | 4 / 10 | 10 | 🔴 F |
| 에러 처리 | 6 / 10 | 10 | 🟡 C |
| **전체** | **26 / 60** | **60** | **🔴 F** |

---

## ✅ 권장 조치사항 (우선순위별)

### Priority 1: Critical (즉시 수정 필요)
1. [ ] **세션에서 accessToken 제거**
   - 파일: `frontend/src/auth.ts`
   - 예상 시간: 15분

2. [ ] **NEXTAUTH_SECRET 환경변수 검증**
   - 파일: `frontend/src/auth.ts`
   - 예상 시간: 10분

3. [ ] **백엔드 SECRET_KEY 검증**
   - 파일: `backend/auth.py`
   - 예상 시간: 10분

4. [ ] **CORS 설정 강화**
   - 파일: `backend/main.py`
   - 예상 시간: 20분

5. [ ] **관리자 권한 체크 추가**
   - 파일: `backend/auth.py`, `backend/routers/admin.py`
   - 예상 시간: 30분

### Priority 2: High (1주일 내 수정)
6. [ ] **Google OAuth 토큰 검증 강화**
   - 파일: `backend/auth.py`
   - 예상 시간: 30분

7. [ ] **세션 타임아웃 설정**
   - 파일: `frontend/src/auth.ts`
   - 예상 시간: 10분

8. [ ] **signIn 콜백 구현**
   - 파일: `frontend/src/auth.ts`, `backend/routers/auth.py`
   - 예상 시간: 1시간

### Priority 3: Medium (2주일 내 수정)
9. [ ] **에러 메시지 필터링**
   - 파일: `frontend/src/lib/api.ts`, `backend/main.py`
   - 예상 시간: 30분

10. [ ] **환경변수 검증 추가**
    - 파일: `frontend/src/auth.ts`, `backend/main.py`
    - 예상 시간: 20분

11. [ ] **Rate Limiting 구현**
    - 파일: `backend/main.py`
    - 예상 시간: 1시간

### Priority 4: Low (1개월 내 개선)
12. [ ] **보안 헤더 추가**
    - 파일: `frontend/next.config.ts`, `backend/main.py`
    - 예상 시간: 30분

13. [ ] **감사 로깅 구현**
    - 파일: `backend/routers/admin.py`
    - 예상 시간: 2시간

14. [ ] **보안 테스트 자동화**
    - 파일: 새로운 테스트 파일
    - 예상 시간: 4시간

---

## 🔍 보안 테스트 시나리오

### 1. 인증 우회 테스트
```bash
# 토큰 없이 admin API 호출
curl -X GET http://localhost:8000/admin/dashboard
# 예상: 401 Unauthorized

# 잘못된 토큰으로 호출
curl -X GET http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer invalid_token"
# 예상: 401 Unauthorized

# 일반 사용자 토큰으로 admin API 호출
curl -X GET http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer {user_token}"
# 예상: 403 Forbidden (role 체크 구현 후)
```

### 2. CORS 테스트
```javascript
// 악의적인 사이트에서 API 호출 시도
fetch('http://localhost:8000/admin/dashboard', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Origin': 'https://evil.com'
  }
});
// 예상: CORS 에러
```

### 3. 세션 탈취 테스트
```javascript
// 개발자 도구에서 세션 확인
console.log(await getSession());
// 예상: accessToken이 노출되지 않아야 함 (수정 후)
```

---

## 📚 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/security/overview)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/security-best-practices)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

## 🎯 다음 단계

1. **즉시:** Priority 1 항목 수정 (1-2시간)
2. **이번 주:** Priority 2 항목 수정 (3-4시간)
3. **이번 달:** Priority 3-4 항목 개선
4. **정기 검토:** 월 1회 보안 감사 수행
5. **모니터링:** 의심스러운 활동 로깅 및 알림 설정

---

**마지막 업데이트:** 2026-01-29  
**다음 검토 예정일:** 2026-02-29  
**담당자:** Security Team
