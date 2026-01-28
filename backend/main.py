from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers import auth, reservations, products, reviews, gallery, orders, admin

app = FastAPI(
    title="Reservation & Shop API",
)

@app.get("/health")
def health():
    return {"ok": True}
# CORS 설정: env ALLOWED_ORIGINS 로 제한 가능 (쉼표 구분)
# CORS 설정
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")

origins = (
    ["*"]
    if allowed_origins == "*"
    else [o.strip() for o in allowed_origins.split(",")]
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


# 라우터 등록
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(products.router)
app.include_router(reviews.router)
app.include_router(gallery.router)
app.include_router(orders.router)
app.include_router(admin.router)
from fastapi import Header
from typing import Optional

from fastapi import Header, HTTPException
from typing import Optional
import requests

@app.get("/me")
def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    access_token = authorization.split(" ", 1)[1].strip()

    r = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")

    return r.json()
from fastapi import Depends

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
        raise HTTPException(status_code=401, detail="Invalid token")

    return r.json()
@app.get("/admin/ping")
def admin_ping(user=Depends(require_google_user)):
    return {"ok": True, "user": user}
    