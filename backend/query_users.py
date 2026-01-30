"""users 테이블 조회 스크립트"""
import os
import sys

# backend 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
import models

def main():
    db = SessionLocal()
    try:
        users = db.query(models.User).order_by(models.User.id).all()
        print("=== users 테이블 컬럼 ===")
        if users:
            cols = [c.key for c in models.User.__table__.columns]
            print(", ".join(cols))
        else:
            print("id, email, name, role, is_active, auth_provider, is_logged_in, last_login, created_at, ...")
        print()
        print(f"=== users 테이블 데이터 (총 {len(users)}건) ===")
        print()
        for u in users:
            d = {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": str(u.created_at) if u.created_at else None,
            }
            if hasattr(u, "auth_provider"):
                d["auth_provider"] = getattr(u, "auth_provider", None)
            if hasattr(u, "is_logged_in"):
                d["is_logged_in"] = getattr(u, "is_logged_in", None)
            if hasattr(u, "last_login"):
                d["last_login"] = str(u.last_login) if getattr(u, "last_login") else None
            print(d)
        print()
    finally:
        db.close()

if __name__ == "__main__":
    main()
