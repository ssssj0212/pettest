from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas
from ..auth import require_google_user


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def get_dashboard(
    current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """관리자 대시보드 통계"""
    # 예약 통계
    total_reservations = db.query(func.count(models.Reservation.id)).scalar()
    pending_reservations = (
        db.query(func.count(models.Reservation.id))
        .filter(models.Reservation.status == "BOOKED")
        .scalar()
    )

    # 주문 통계
    total_orders = db.query(func.count(models.Order.id)).scalar()
    pending_orders = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.status == "PENDING")
        .scalar()
    )
    total_revenue = (
        db.query(func.sum(models.Order.total_amount))
        .filter(models.Order.status == "PAID")
        .scalar() or 0
    )

    # 사용자 통계
    total_users = db.query(func.count(models.User.id)).scalar()

    # 리뷰 통계
    total_reviews = db.query(func.count(models.Review.id)).scalar()
    avg_rating = (
        db.query(func.avg(models.Review.rating))
        .scalar() or 0
    )

    return {
        "reservations": {
            "total": total_reservations,
            "pending": pending_reservations,
        },
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "total_revenue": float(total_revenue),
        },
        "users": {
            "total": total_users,
        },
        "reviews": {
            "total": total_reviews,
            "average_rating": float(avg_rating),
        },
    }


@router.get("/reservations", response_model=List[schemas.ReservationRead])
def list_all_reservations(
    skip: int = 0,
    limit: int = 50,
   current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """모든 예약 목록 조회 (관리자만)"""
    reservations = (
        db.query(models.Reservation)
        .order_by(models.Reservation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return reservations


@router.get("/orders", response_model=List[schemas.OrderRead])
def list_all_orders(
    skip: int = 0,
    limit: int = 50,
   current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """모든 주문 목록 조회 (관리자만)"""
    orders = (
        db.query(models.Order)
        .order_by(models.Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for order in orders:
        order_items = (
            db.query(models.OrderItem)
            .filter(models.OrderItem.order_id == order.id)
            .all()
        )
        order_data = schemas.OrderRead.model_validate(order)
        order_data.items = [
            schemas.OrderItemRead.model_validate(item) for item in order_items
        ]
        result.append(order_data)

    return result


@router.post("/products", response_model=schemas.ProductRead)
def create_product(
    product_in: schemas.ProductCreate,
    current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """상품 생성 (관리자만)"""
    product = models.Product(
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    product_update: schemas.ProductCreate,
    current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """상품 수정 (관리자만)"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

    product.name = product_update.name
    product.description = product_update.description
    product.price = product_update.price

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """상품 삭제 (관리자만)"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

    product.is_active = False
    db.commit()
    return {"message": "상품이 삭제되었습니다."}


@router.get("/users", response_model=List[schemas.UserRead])
def list_all_users(
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(require_google_user),
    db: Session = Depends(get_db),
):
    """모든 사용자 목록 조회 (관리자만)"""
    users = (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return users
























