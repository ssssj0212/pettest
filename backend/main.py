from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers import auth, reservations, products

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


# 라우터 등록
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(products.router)



