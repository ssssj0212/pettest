from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from database import get_db
import models

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 스키마 (토큰 받을 엔드포인트)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# JWT 설정 - 환경변수 검증
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "SECRET_KEY 환경변수가 설정되지 않았습니다. "
        "강력한 랜덤 문자열을 설정하세요: "
        "python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )

if len(SECRET_KEY) < 32:
    raise ValueError("SECRET_KEY는 최소 32자 이상이어야 합니다.")

# 프로덕션에서 취약한 KEY 차단
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    weak_keywords = ["changeme", "secret", "password", "example", "test", "your-"]
    if any(kw in SECRET_KEY.lower() for kw in weak_keywords):
        raise ValueError(
            "프로덕션 환경에서 취약한 SECRET_KEY를 사용할 수 없습니다."
        )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """현재 로그인한 사용자 가져오기"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """활성 사용자만 허용"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 사용자입니다.")
    return current_user


def get_current_admin_user(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """관리자만 허용"""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다.",
        )
    return current_user


# ===============================
# Google Bearer token auth helper
# ===============================
from fastapi import Header
import requests


def verify_google_id_token(id_token: str) -> dict:
    """Google id_token 검증 (tokeninfo 엔드포인트 사용)"""
    response = requests.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"id_token": id_token},
        timeout=10,
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google 토큰이 유효하지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return response.json()


def get_current_user_from_google(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """Google id_token으로 현재 사용자 조회/생성"""
    info = verify_google_id_token(token)

    email = info.get("email")
    name = info.get("name") or info.get("given_name") or ""

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google 계정 이메일을 확인할 수 없습니다.",
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    now = datetime.now(timezone.utc)

    if not user:
        user = models.User(
            email=email,
            name=name,
            password_hash="",  # OAuth 사용자 (DB NOT NULL 대비)
            role="USER",
            is_active=True,
            last_login_at=now,
            last_seen_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_login_at = now 
        user.last_seen_at = now
        db.commit()
        db.refresh(user)

    return user


def require_google_user(authorization: Optional[str] = Header(None)):
    """Google OAuth Bearer 토큰 검증"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    access_token = authorization.split(" ", 1)[1].strip()

    try:
        # 1. Google tokeninfo API로 토큰 검증 (더 안전함)
        r = requests.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            params={"access_token": access_token},
            timeout=5,
        )

        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")
        
        token_info = r.json()
        
        # 2. 토큰 발급자 확인
        if token_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
        
        # 3. 만료 시간 확인
        expires_in = token_info.get("expires_in", 0)
        if expires_in <= 0:
            raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")
        
        # 4. 사용자 정보 가져오기
        user_r = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )
        
        if user_r.status_code != 200:
            raise HTTPException(status_code=401, detail="사용자 정보를 가져올 수 없습니다.")
        
        user_info = user_r.json()
        
        # 5. 이메일 인증 확인
        if not user_info.get("email_verified", False):
            raise HTTPException(
                status_code=403, 
                detail="인증된 이메일 주소가 필요합니다."
            )
        
        # 6. 필수 필드 확인
        if not user_info.get("email"):
            raise HTTPException(status_code=400, detail="사용자 정보가 불완전합니다.")
        
        return user_info
        
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="인증 서비스에 연결할 수 없습니다."
        )


def require_google_admin_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.User:
    """Google OAuth 토큰 검증 + DB User role 체크"""
    # 1. Google 토큰 검증
    google_user = require_google_user(authorization)
    email = google_user.get("email")
    
    # 2. DB에서 사용자 조회
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=403, 
            detail="등록되지 않은 사용자입니다. 관리자에게 문의하세요."
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

























