from .database import engine, Base
from . import models  # noqa: F401  # models를 import 해야 테이블이 인식됨


def init_db() -> None:
    """
    SQLAlchemy models 기반으로 DB에 테이블 생성.
    이미 존재하는 테이블은 건너뜀.
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("✅ Database tables created (if not existing).")




