from .database import engine, Base, SessionLocal
import models  # noqa: F401  # models를 import 해야 테이블이 인식됨
from .seed_data import seed_data


def init_db(seed: bool = False) -> None:
    """
    SQLAlchemy models 기반으로 DB에 테이블 생성.
    이미 존재하는 테이블은 건너뜀.
    
    Args:
        seed: True이면 샘플 데이터도 추가
    """
    print("📦 데이터베이스 테이블 생성 중...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created (if not existing).")
    
    if seed:
        print("\n🌱 샘플 데이터 추가 중...")
        db = SessionLocal()
        try:
            seed_data(db)
        finally:
            db.close()


if __name__ == "__main__":
    import sys
    # 명령줄 인자로 --seed를 전달하면 샘플 데이터도 추가
    seed = "--seed" in sys.argv or "-s" in sys.argv
    init_db(seed=seed)




