from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import os

from .database import get_db
from . import models, schemas

app = FastAPI(
    title="Reservation & Shop API",
    version="0.1.0",
)

# CORS 설정: env ALLOWED_ORIGINS 로 제한 가능 (쉼표 구분)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = (
    ["*"]
    if allowed_origins.strip() == "*"
    else [origin.strip() for origin in allowed_origins.split(",")]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Reservation & Shop backend running"}


# -----------------------------
# 간단한 회원 가입 / 로그인 (데모용)
# -----------------------------

@app.post("/auth/register", response_model=schemas.UserRead)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 이메일입니다.",
        )

    # 데모용: 비밀번호 해싱 없이 저장 (실서비스에서는 반드시 해싱 필요!)
    user = models.User(
        email=user_in.email,
        password_hash=user_in.password,
        name=user_in.name,
        phone=user_in.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or user.password_hash != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )
    # 데모용: 진짜 JWT 대신 간단한 토큰 문자열 반환
    return {"token": f"demo-token-{user.id}", "user_id": user.id, "name": user.name}


# -----------------------------
# 예약 관련 API
# -----------------------------

@app.post("/reservations", response_model=schemas.ReservationRead)
def create_reservation(
    reservation_in: schemas.ReservationCreate,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == reservation_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    reservation = models.Reservation(
        user_id=reservation_in.user_id,
        reserved_at=reservation_in.reserved_at,
        memo=reservation_in.memo,
        status="BOOKED",
        created_at=datetime.utcnow(),
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


@app.get("/reservations", response_model=List[schemas.ReservationRead])
def list_reservations(user_id: int, db: Session = Depends(get_db)):
    reservations = (
        db.query(models.Reservation)
        .filter(models.Reservation.user_id == user_id)
        .order_by(models.Reservation.reserved_at.desc())
        .all()
    )
    return reservations


# -----------------------------
# 상품 / 주문 (상품 목록만 우선)
# -----------------------------

@app.get("/products", response_model=List[schemas.ProductRead])
def list_products(db: Session = Depends(get_db)):
    products = (
        db.query(models.Product)
        .filter(models.Product.is_active == True)  # noqa: E712
        .order_by(models.Product.created_at.desc())
        .all()
    )
    return products



