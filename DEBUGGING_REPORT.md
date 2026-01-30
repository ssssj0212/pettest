# 🔍 Admin 페이지 전체 흐름 디버깅 리포트

## 📋 목차
1. [전체 흐름 분석](#전체-흐름-분석)
2. [발견된 문제점](#발견된-문제점)
3. [해결 방안](#해결-방안)
4. [보안 권장사항](#보안-권장사항)

---

## 🔄 전체 흐름 분석

### 1. 페이지 접속 단계
```
사용자 → /admin 접속
  ↓
admin/page.tsx 렌더링
  - useSession() 실행 (NextAuth)
  - status: "loading" | "authenticated" | "unauthenticated"
```

### 2. 인증 확인 단계 (checkAdmin 함수)
```typescript
// frontend/src/app/admin/page.tsx:59-72
const checkAdmin = async () => {
  if (status === "loading") return;  // 세션 로딩 중
  
  if (status === "unauthenticated") {
    router.push("/api/auth/signin");  // 로그인 페이지로 리다이렉트
    return;
  }
  
  // ⚠️ 여기부터 문제: role 체크 없이 통과!
  // 주석: "role 체크는 Step 3에서 붙일게"
}
```

**🚨 문제점: 로그인만 되면 누구나 접근 가능**

### 3. 데이터 로딩 단계
```typescript
// activeTab 변경 시 해당 데이터 로드
useEffect(() => {
  if (activeTab === "dashboard") loadDashboard();
  else if (activeTab === "reservations") loadReservations();
  // ...
}, [activeTab]);
```

### 4. API 호출 단계
```typescript
// frontend/src/lib/api.ts:6-40
export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = await getSession()
  const token = (session as any)?.accessToken  // NextAuth의 Google access_token
  
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  
  const res = await fetch(`${base}${path}`, { ...init, headers })
  // ...
}
```

### 5. 백엔드 검증 단계
```python
# backend/auth.py:99-116
def require_google_user(authorization: Optional[str] = Header(None)):
    """Google OAuth Bearer 토큰 검증"""
    access_token = authorization.split(" ", 1)[1].strip()
    
    # Google API로 토큰 검증
    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    return r.json()  # Google 사용자 정보만 반환 (DB와 무관!)
```

**🚨 문제점: DB User 테이블과 전혀 연동되지 않음**

### 6. 데이터 쿼리 단계
```python
# backend/routers/admin.py:14-68
@router.get("/dashboard")
def get_dashboard(
    current_user = Depends(require_google_user),  # ⚠️ role 체크 없음
    db: Session = Depends(get_db),
):
    # DB 쿼리 실행하여 통계 데이터 반환
    total_reservations = db.query(func.count(models.Reservation.id)).scalar()
    # ...
```

---

## 🚨 발견된 문제점

### Critical Issue 1: 관리자 권한 체크 완전 누락
**심각도: 🔴 Critical**

#### 문제:
- 프론트엔드에서 role 체크 없음 (TODO 주석만 존재)
- 백엔드에서도 role 체크 없음
- **Google 계정만 있으면 누구나 관리자 페이지 접근 가능**

#### 영향:
- 모든 사용자 정보 조회 가능
- 예약, 주문, 리뷰 등 모든 데이터 접근 가능
- 상품 생성/수정/삭제 가능

### Critical Issue 2: 인증 시스템 이중화 및 불일치
**심각도: 🔴 Critical**

#### 문제:
1. **DB 기반 JWT 인증** (auth.py)
   - `get_current_user`: JWT 토큰으로 DB User 조회
   - `get_current_admin_user`: role="ADMIN" 체크 포함
   - **하지만 admin 라우트에서 사용되지 않음!**

2. **Google OAuth 검증만** (admin.py)
   - `require_google_user`: Google API로 토큰만 검증
   - DB User와 연결 안됨
   - role 정보 없음

#### 구조적 문제:
```
┌─────────────────────────────────────────────┐
│ Frontend (NextAuth)                         │
│  - Google OAuth                             │
│  - session.accessToken (Google token)       │
└─────────────┬───────────────────────────────┘
              │ Bearer token
              ▼
┌─────────────────────────────────────────────┐
│ Backend                                     │
│                                             │
│ ✅ JWT Auth (사용 안함)                      │
│    - get_current_user                       │
│    - get_current_admin_user                 │
│    - DB User와 연동                          │
│                                             │
│ ❌ Google OAuth (현재 사용 중)               │
│    - require_google_user                    │
│    - DB와 무관                               │
│    - role 체크 없음                          │
└─────────────────────────────────────────────┘
```

### High Issue 3: 세션-DB 사용자 매핑 누락
**심각도: 🟠 High**

#### 문제:
- NextAuth 로그인 시 DB에 사용자 정보 저장 안됨
- `auth.ts:21-29` signIn 콜백에 TODO만 있음
- Google 로그인 사용자와 DB User 레코드 연결 안됨

```typescript
// frontend/src/auth.ts:21-29
async signIn({ user, account, profile }) {
  // TODO: FastAPI 백엔드와 연동
  // 예: await fetch(`${BACKEND_URL}/auth/google`, { ... })
  return true;
}
```

### Medium Issue 4: 프론트엔드 보안 취약점
**심각도: 🟡 Medium**

#### 문제:
1. 클라이언트 사이드 보안만 의존
   - 개발자 도구로 우회 가능
   - React 상태 조작 가능

2. 에러 처리 부족
   - API 호출 실패 시 사용자에게 정보 노출
   - 타임아웃만 있고 재시도 로직 없음

---

## ✅ 해결 방안

### 1단계: 백엔드 role 기반 권한 체크 추가 (우선순위: Critical)

#### A. Google OAuth 사용자를 DB User와 연동

**backend/auth.py 수정:**
```python
def require_google_admin_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Google OAuth 토큰 검증 + DB User role 체크"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    access_token = authorization.split(" ", 1)[1].strip()

    # 1. Google 토큰 검증
    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    google_user = r.json()
    email = google_user.get("email")
    
    # 2. DB에서 사용자 조회
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=403, 
            detail="사용자가 등록되지 않았습니다."
        )
    
    # 3. 활성 상태 체크
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="비활성화된 사용자입니다."
        )
    
    # 4. 관리자 권한 체크
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="관리자 권한이 필요합니다."
        )
    
    return user
```

#### B. Admin 라우터 전체 수정

**backend/routers/admin.py:**
```python
from ..auth import require_google_admin_user  # 새로운 함수 사용

@router.get("/dashboard")
def get_dashboard(
    current_user: models.User = Depends(require_google_admin_user),  # ✅ role 체크 포함
    db: Session = Depends(get_db),
):
    # ...
```

**모든 admin 엔드포인트에 적용:**
- `/admin/dashboard`
- `/admin/reservations`
- `/admin/orders`
- `/admin/users`
- `/admin/products` (POST, PATCH, DELETE)

### 2단계: 프론트엔드 role 체크 추가

#### A. 사용자 정보 가져오기 API 수정

**backend/main.py 또는 backend/routers/auth.py:**
```python
@router.get("/me")
def get_me_google(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Google OAuth 토큰으로 DB User 정보 조회"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    access_token = authorization.split(" ", 1)[1].strip()

    # Google 토큰 검증
    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    google_user = r.json()
    email = google_user.get("email")
    
    # DB에서 사용자 조회
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # 신규 사용자 자동 생성 (옵션)
        user = models.User(
            email=email,
            name=google_user.get("name", ""),
            password_hash="",  # OAuth 사용자는 비밀번호 불필요
            role="USER",  # 기본 역할
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "is_active": user.is_active,
    }
```

#### B. admin/page.tsx 수정

```typescript
const checkAdmin = async () => {
  if (status === "loading") return;

  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return;
  }

  // ✅ role 체크 추가
  try {
    const user = await getMe();  // /me 엔드포인트 호출
    
    if (user.role !== "ADMIN") {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return;
    }
  } catch (err) {
    console.error("권한 확인 실패:", err);
    router.push("/api/auth/signin");
  }
};
```

### 3단계: NextAuth signIn 콜백 구현

**frontend/src/auth.ts:**
```typescript
async signIn({ user, account, profile }) {
  try {
    // Google access token으로 백엔드 /me 호출
    // 사용자가 DB에 없으면 자동 생성됨
    const response = await fetch(`${process.env.BACKEND_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${account?.access_token}`,
      },
    });
    
    if (!response.ok) {
      console.error("백엔드 사용자 확인 실패");
      return false;
    }
    
    const dbUser = await response.json();
    
    // 비활성 사용자 차단
    if (!dbUser.is_active) {
      console.error("비활성화된 사용자");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("signIn 콜백 오류:", error);
    return false;
  }
}
```

---

## 🔐 보안 권장사항

### 1. 백엔드 보안
- ✅ **모든 admin 엔드포인트에 role 체크 적용**
- ✅ **DB User와 Google OAuth 연동**
- ✅ **비활성 사용자 차단**
- ⚠️ SECRET_KEY 환경변수 검증 추가
- ⚠️ CORS 설정 검토 (production에서 "*" 금지)

### 2. 프론트엔드 보안
- ✅ **클라이언트 role 체크 추가** (UX용)
- ⚠️ 서버 응답 기반으로만 UI 제어 (클라이언트 검증은 우회 가능)
- ⚠️ 민감한 에러 메시지 숨기기

### 3. 환경변수 보안
- ⚠️ NEXTAUTH_SECRET 32자 이상 랜덤 문자열 사용
- ⚠️ SECRET_KEY 변경 (기본값: "changeme-secret-key")
- ⚠️ 환경변수 누락 시 서버 시작 실패하도록 검증

### 4. 데이터베이스 보안
- ⚠️ 관리자 계정 초기 생성 스크립트 작성
- ⚠️ 역할 변경 이벤트 로깅
- ⚠️ Login 테이블 활용하여 관리자 접근 기록

---

## 📊 우선순위

| 순위 | 작업 | 심각도 | 예상 시간 |
|------|------|--------|-----------|
| 1 | 백엔드 `require_google_admin_user` 구현 | Critical | 30분 |
| 2 | Admin 라우터 권한 체크 적용 | Critical | 20분 |
| 3 | `/me` 엔드포인트 DB 연동 | Critical | 20분 |
| 4 | 프론트엔드 role 체크 추가 | High | 15분 |
| 5 | NextAuth signIn 콜백 구현 | High | 15분 |
| 6 | 환경변수 검증 추가 | Medium | 10분 |

**총 예상 시간: 약 2시간**

---

## 🧪 테스트 체크리스트

### 시나리오 1: 비로그인 사용자
- [ ] `/admin` 접속 → 로그인 페이지 리다이렉트
- [ ] API 직접 호출 → 401 에러

### 시나리오 2: 일반 사용자 (role=USER)
- [ ] Google 로그인 성공
- [ ] `/admin` 접속 → "관리자 권한 필요" 메시지 + 홈으로 리다이렉트
- [ ] Admin API 직접 호출 → 403 에러

### 시나리오 3: 관리자 (role=ADMIN)
- [ ] Google 로그인 성공
- [ ] `/admin` 접속 → 정상 진입
- [ ] Dashboard 데이터 로딩 성공
- [ ] 각 탭 데이터 로딩 성공
- [ ] 상품 CRUD 정상 작동

### 시나리오 4: 비활성 사용자 (is_active=False)
- [ ] Google 로그인 → signIn 콜백에서 차단
- [ ] API 호출 → 403 에러

---

## 📝 참고 자료

### 관련 파일
- `frontend/src/app/admin/page.tsx` (line 59-72)
- `frontend/src/lib/api.ts` (line 6-40)
- `frontend/src/auth.ts` (line 21-29)
- `backend/auth.py` (line 99-116)
- `backend/routers/admin.py` (전체)
- `backend/models.py` (User 모델)

### 데이터베이스 스키마
```sql
-- User role 확인
SELECT id, email, name, role, is_active FROM users;

-- 관리자 수동 설정
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@gmail.com';
```
