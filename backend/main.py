from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import os
import logging

from routers import auth, reservations, products, reviews, gallery, orders, admin
from database import get_db
from auth import get_current_user_from_google, verify_google_id_token
import models

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경변수 검증
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
    logger.info("개발 환경: 기본 CORS 설정 사용")

origins = [o.strip() for o in allowed_origins_str.split(",")]

# HTTPS 검증 (프로덕션)
if ENVIRONMENT == "production":
    for origin in origins:
        if not origin.startswith("https://"):
            raise ValueError(
                f"프로덕션 환경에서는 HTTPS origin만 허용됩니다: {origin}"
            )

logger.info(f"CORS 설정: {origins}")

app = FastAPI(
    title="Reservation & Shop API",
    description="Reservation & Shop Backend API with Google OAuth",
    version="1.0.0",
)

@app.get("/health")
def health():
    return {"ok": True, "environment": ENVIRONMENT}

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    max_age=600,  # Preflight 캐시 10분
)



@app.get("/")
async def root():
    return {"message": "Reservation & Shop backend running"}


# 라우터 등록
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(products.router)
app.include_router(reviews.router)
app.include_router(gallery.router)
app.include_router(orders.router)
app.include_router(admin.router)

@app.get("/me")
def get_me_with_db(current_user: models.User = Depends(get_current_user_from_google)):
    """Google id_token으로 DB User 조회/자동 생성. Bearer 토큰에 id_token 전달."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@app.post("/logout")
def logout_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Google id_token 검증 후 해당 사용자 last_logout_at 업데이트."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer id_token이 필요합니다.")
    id_token = authorization.split(" ", 1)[1].strip()
    try:
        info = verify_google_id_token(id_token)
        email = info.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="토큰에서 이메일을 확인할 수 없습니다.")
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            from datetime import datetime, timezone
            user.last_logout_at = datetime.now(timezone.utc)
            db.commit()
        return {"message": "로그아웃 성공"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그아웃 실패: %s", e)
        raise HTTPException(status_code=500, detail="로그아웃 처리 중 오류가 발생했습니다.")
