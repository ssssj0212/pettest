from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt

from database import get_db
import models
import os

router = APIRouter(prefix="/auth", tags=["auth"])

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


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
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    이메일/비밀번호로 회원가입
    - Google 이메일로 가입하면 나중에 Google로도 로그인 가능
    """
    # 1. 이메일 중복 확인
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다."
        )

    # 2. 비밀번호 해싱
    hashed_password = get_password_hash(user_data.password)

    # 3. 사용자 생성 (Neon DB camelCase 컬럼만 사용)
    new_user = models.User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        phone=user_data.phone,
        role="USER",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. JWT 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": new_user.id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
        }
    }


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    이메일/비밀번호로 로그인
    - Google로 가입한 사용자도 비밀번호를 설정하면 이메일로 로그인 가능
    """
    # 1. 사용자 조회
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )

    # 2. 비밀번호 확인
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google로 가입한 계정입니다. Google 로그인을 사용하세요."
        )
    
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )

    # 3. 활성 사용자 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다."
        )

    db.commit()

    # 5. JWT 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        }
    }


@router.post("/logout")
def logout(email: EmailStr, db: Session = Depends(get_db)):
    """
    로그아웃 - DB 플래그 업데이트
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    db.commit()

    return {
        "message": "로그아웃 성공",
        "email": email,
        "is_logged_in": False
    }


@router.post("/set-password")
def set_password(
    email: EmailStr,
    new_password: str,
    db: Session = Depends(get_db)
):
    """
    Google로 가입한 사용자가 비밀번호를 설정
    - 설정 후 Google 로그인 + 이메일 로그인 둘 다 가능
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )

    user.password_hash = get_password_hash(new_password)
    db.commit()

    return {
        "message": "비밀번호가 설정되었습니다. 이제 Google과 이메일 로그인 모두 사용 가능합니다."
    }


@router.get("/check-auth-provider/{email}")
def check_auth_provider(email: EmailStr, db: Session = Depends(get_db)):
    """
    사용자의 로그인 방법 확인
    - 프론트엔드에서 어떤 로그인 방법을 제공할지 결정
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        return {
            "exists": False,
            "has_password": False,
            "message": "등록되지 않은 이메일입니다."
        }

    return {
        "exists": True,
        "has_password": bool(user.password_hash and user.password_hash.strip()),
        "message": "이메일 로그인을 사용하세요." if user.password_hash else "Google 로그인을 사용하세요."
    }
