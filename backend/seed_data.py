"""
데이터베이스에 샘플 데이터를 추가하는 스크립트
"""
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
import bcrypt

from .database import SessionLocal
import models


def seed_data(db: Session):
    """샘플 데이터 추가"""
    
    # 기존 데이터 확인
    existing_users = db.query(models.User).count()
    if existing_users > 0:
        print("⚠️  이미 데이터가 존재합니다. 건너뜁니다.")
        return
    
    print("🌱 샘플 데이터 추가 중...")
    
    # 비밀번호 해싱 함수 (bcrypt 직접 사용)
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    # 1. 사용자 생성
    admin_user = models.User(
        email="admin@example.com",
        password_hash=hash_password("admin123"),
        name="관리자",
        phone="010-0000-0000",
        role="ADMIN",
        is_active=True
    )
    
    user1 = models.User(
        email="user1@example.com",
        password_hash=hash_password("user123"),
        name="홍길동",
        phone="010-1111-1111",
        role="USER",
        is_active=True
    )
    
    user2 = models.User(
        email="user2@example.com",
        password_hash=hash_password("user123"),
        name="김철수",
        phone="010-2222-2222",
        role="USER",
        is_active=True
    )
    
    db.add(admin_user)
    db.add(user1)
    db.add(user2)
    db.commit()
    db.refresh(admin_user)
    db.refresh(user1)
    db.refresh(user2)
    
    print("✅ 사용자 생성 완료 (admin@example.com / admin123)")
    print("   - user1@example.com / user123")
    print("   - user2@example.com / user123")
    
    # 2. 상품 생성
    products = [
        models.Product(
            name="아메리카노",
            description="진한 에스프레소와 뜨거운 물의 조화",
            price=Decimal("4500.00"),
            is_active=True
        ),
        models.Product(
            name="카페라떼",
            description="부드러운 우유와 에스프레소의 만남",
            price=Decimal("5000.00"),
            is_active=True
        ),
        models.Product(
            name="카푸치노",
            description="에스프레소에 우유 거품을 올린 클래식 커피",
            price=Decimal("5000.00"),
            is_active=True
        ),
        models.Product(
            name="바닐라라떼",
            description="바닐라 시럽이 들어간 달콤한 라떼",
            price=Decimal("5500.00"),
            is_active=True
        ),
        models.Product(
            name="카라멜마키아토",
            description="카라멜 시럽과 거품이 올라간 커피",
            price=Decimal("5500.00"),
            is_active=True
        ),
        models.Product(
            name="초콜릿 케이크",
            description="진한 초콜릿으로 만든 부드러운 케이크",
            price=Decimal("8000.00"),
            is_active=True
        ),
        models.Product(
            name="치즈케이크",
            description="부드럽고 크리미한 뉴욕 스타일 치즈케이크",
            price=Decimal("8500.00"),
            is_active=True
        ),
        models.Product(
            name="크로와상",
            description="바삭하고 부드러운 프랑스식 크로와상",
            price=Decimal("4000.00"),
            is_active=True
        ),
    ]
    
    for product in products:
        db.add(product)
    db.commit()
    
    for product in products:
        db.refresh(product)
    
    print(f"✅ 상품 {len(products)}개 생성 완료")
    
    # 3. 예약 생성
    reservations = [
        models.Reservation(
            user_id=user1.id,
            reserved_at=datetime.utcnow() + timedelta(days=1, hours=14),
            status="BOOKED",
            memo="창가 자리 부탁드립니다"
        ),
        models.Reservation(
            user_id=user2.id,
            reserved_at=datetime.utcnow() + timedelta(days=2, hours=15),
            status="BOOKED",
            memo="조용한 자리 부탁드립니다"
        ),
        models.Reservation(
            user_id=user1.id,
            reserved_at=datetime.utcnow() + timedelta(days=3, hours=16),
            status="BOOKED",
            memo=None
        ),
    ]
    
    for reservation in reservations:
        db.add(reservation)
    db.commit()
    
    for reservation in reservations:
        db.refresh(reservation)
    
    print(f"✅ 예약 {len(reservations)}개 생성 완료")
    
    # 4. 주문 생성
    order1 = models.Order(
        user_id=user1.id,
        total_amount=Decimal("9500.00"),
        status="PAID",
        payment_method="CARD",
        payment_status="COMPLETED"
    )
    db.add(order1)
    db.commit()
    db.refresh(order1)
    
    # 주문 항목
    order_items = [
        models.OrderItem(
            order_id=order1.id,
            product_id=products[0].id,  # 아메리카노
            quantity=1,
            unit_price=Decimal("4500.00")
        ),
        models.OrderItem(
            order_id=order1.id,
            product_id=products[5].id,  # 초콜릿 케이크
            quantity=1,
            unit_price=Decimal("5000.00")
        ),
    ]
    
    for item in order_items:
        db.add(item)
    db.commit()
    
    print("✅ 주문 1개 생성 완료")
    
    # 5. 리뷰 생성
    reviews = [
        models.Review(
            user_id=user1.id,
            reservation_id=reservations[0].id,
            rating=5,
            comment="분위기가 좋고 커피도 맛있었어요!"
        ),
        models.Review(
            user_id=user1.id,
            order_id=order1.id,
            rating=4,
            comment="케이크가 정말 맛있었습니다. 다음에도 주문할게요!"
        ),
    ]
    
    for review in reviews:
        db.add(review)
    db.commit()
    
    print(f"✅ 리뷰 {len(reviews)}개 생성 완료")
    
    # 6. 갤러리 이미지 생성 (예시 URL)
    gallery_items = [
        models.Gallery(
            image_url="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
            caption="아늑한 카페 인테리어",
            is_active=True
        ),
        models.Gallery(
            image_url="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
            caption="신선한 커피 원두",
            is_active=True
        ),
        models.Gallery(
            image_url="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800",
            caption="맛있는 디저트",
            is_active=True
        ),
        models.Gallery(
            image_url="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800",
            caption="편안한 분위기",
            is_active=True
        ),
    ]
    
    for item in gallery_items:
        db.add(item)
    db.commit()
    
    print(f"✅ 갤러리 이미지 {len(gallery_items)}개 생성 완료")
    
    print("\n🎉 모든 샘플 데이터 추가 완료!")
    print("\n📝 로그인 정보:")
    print("   관리자: admin@example.com / admin123")
    print("   사용자1: user1@example.com / user123")
    print("   사용자2: user2@example.com / user123")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

