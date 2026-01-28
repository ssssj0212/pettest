from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserRead)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 이메일입니다.",
        )

    user = models.User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        name=user_in.name,
        phone=user_in.phone,
        role="USER",  # 기본값은 USER
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """로그인 (JWT 토큰 발급)"""
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # IP 주소와 User-Agent 가져오기
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", None)
    
    # 로그인 시도 기록 (실패 시)
    if not user or not verify_password(form_data.password, user.password_hash):
        login_log = models.Login(
            user_id=user.id if user else None,
            success=False,
            failure_reason="이메일 또는 비밀번호가 올바르지 않습니다.",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(login_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        login_log = models.Login(
            user_id=user.id,
            success=False,
            failure_reason="비활성화된 사용자입니다.",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(login_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비활성화된 사용자입니다.",
        )

    # 로그인 성공 기록
    login_log = models.Login(
        user_id=user.id,
        success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(login_log)
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    }


@router.get("/me", response_model=schemas.UserRead)
def get_me(current_user: models.User = Depends(get_current_active_user)):
    """현재 로그인한 사용자 정보"""
    return current_user
from fastapi import Header, HTTPException
from typing import Optional
import requests

def get_current_admin_user(authorization: Optional[str] = Header(None)):
    raise HTTPException(status_code=418, detail="HIT GOOGLE ADMIN AUTH")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    access_token = authorization.split(" ", 1)[1].strip()

    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    userinfo = r.json()

    ADMIN_EMAILS = {
        "ssssj0212@gmail.com",
    }

    if userinfo.get("email") not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not an admin")

    return userinfo
from fastapi import Header, HTTPException
from typing import Optional
import requests

def require_google_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    access_token = authorization.split(" ", 1)[1].strip()

    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    return r.json()
