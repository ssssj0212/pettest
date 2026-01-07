from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# 환경변수에서 DB URL 읽기
# PostgreSQL (Neon): postgresql+psycopg://user:password@host:5432/dbname
# 로컬 개발용 SQLite 기본값
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./reservation_db.sqlite",
)

# SQLite는 check_same_thread=False 필요
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

