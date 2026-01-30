# ✅ 검증 체크리스트 (Steps 2–5)

변경 사항 적용 후 아래 순서대로 확인하세요.

---

## Step 2: DB 마이그레이션 (Neon)

- [ ] **Neon 콘솔**에서 `backend/neon_migration_activity.sql` 실행 완료
- [ ] `users` 테이블에 `lastLoginAt`, `lastLogoutAt`, `lastSeenAt` 컬럼 존재 확인
- [ ] `backend/models.py`의 `User` 모델에 해당 필드 매핑 확인됨

---

## Step 3: 백엔드

### 환경 및 실행

```powershell
cd backend
# 가상환경 활성화 후
pip install -r requirements.txt   # requests 포함 확인
# .env 로드 후
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

- [ ] `GET /health` → `{"ok": true, "environment": "..."}` (중복 엔드포인트 없음)
- [ ] `GET /me` (Authorization: Bearer \<id_token\>)  
  - 신규 사용자: DB에 생성 + `lastLoginAt`, `lastSeenAt` 설정  
  - 기존 사용자: `lastSeenAt`만 갱신
- [ ] `POST /logout` (Authorization: Bearer \<id_token\>)  
  - 해당 사용자 `lastLogoutAt` 업데이트  
  - 응답: `{"message": "로그아웃 성공"}`

---

## Step 4: 프론트엔드

### 실행

```powershell
cd frontend
npm run dev
```

- [ ] **auth.ts**: JWT에 `idToken` 저장, 세션에는 노출 안 함, `debug: false`
- [ ] **로그인** → Google 로그인 후 메인 페이지 정상 표시
- [ ] **로그아웃** 버튼 클릭 시  
  1. `POST /api/logout` 호출 (서버에서 JWT의 id_token으로 백엔드 `POST /logout` 호출)  
  2. `signOut()` 후 홈으로 이동
- [ ] Neon DB에서 해당 사용자 `lastLogoutAt` 값 갱신 확인 (선택)

---

## Step 5: 통합 확인

- [ ] **전체 시나리오**: 로그인 → `/me`로 lastSeenAt 갱신 → 로그아웃 → lastLogoutAt 갱신
- [ ] 백엔드 로그에 토큰 출력 없음 (보안)
- [ ] 프론트엔드 `.env.local`에 `BACKEND_URL` 설정됨

---

## 문제 발생 시

- **POST /logout 401**: Bearer에 id_token이 전달되는지 확인 (프론트엔드 JWT에 `idToken` 저장 여부)
- **last_logout_at 미갱신**: Neon에서 `lastLogoutAt` 컬럼 존재 여부, 백엔드 `POST /logout` 호출 여부 확인
- **getToken null**: NextAuth 쿠키/세션이 유효한지, `NEXTAUTH_SECRET` 일치 여부 확인
