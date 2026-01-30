-- DB 마이그레이션: User 테이블에 로그인 관련 필드 추가

-- 1. auth_provider 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';

-- 2. is_logged_in 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_logged_in BOOLEAN DEFAULT FALSE;

-- 3. last_login 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 4. password_hash를 nullable로 변경 (OAuth 사용자는 비밀번호 없음)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 5. 기존 사용자 데이터 업데이트
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;
UPDATE users SET is_logged_in = FALSE WHERE is_logged_in IS NULL;

-- 확인
SELECT id, email, name, role, auth_provider, is_logged_in, last_login 
FROM users 
LIMIT 10;
