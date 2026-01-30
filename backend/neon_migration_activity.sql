-- Step 2: users 테이블에 활동 감사 컬럼 추가 (Neon 콘솔에서 실행)
-- Audit timestamps only (no login-state flag)

ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLogoutAt" TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ NULL;

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('lastLoginAt', 'lastLogoutAt', 'lastSeenAt');
