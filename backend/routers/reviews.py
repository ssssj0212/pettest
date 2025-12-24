from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=schemas.ReviewRead)
def create_review(
    review_in: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """리뷰 작성"""
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="평점은 1-5 사이여야 합니다.",
        )

    # 예약 또는 주문 확인
    if review_in.reservation_id:
        reservation = (
            db.query(models.Reservation)
            .filter(
                models.Reservation.id == review_in.reservation_id,
                models.Reservation.user_id == current_user.id,
            )
            .first()
        )
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="예약을 찾을 수 없습니다.",
            )

    if review_in.order_id:
        order = (
            db.query(models.Order)
            .filter(
                models.Order.id == review_in.order_id,
                models.Order.user_id == current_user.id,
            )
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="주문을 찾을 수 없습니다.",
            )

    review = models.Review(
        user_id=current_user.id,
        reservation_id=review_in.reservation_id,
        order_id=review_in.order_id,
        rating=review_in.rating,
        comment=review_in.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # 사용자 이름 포함하여 반환
    result = schemas.ReviewRead.model_validate(review)
    result.user_name = current_user.name
    return result


@router.get("", response_model=List[schemas.ReviewRead])
def list_reviews(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """리뷰 목록 조회 (인증 불필요)"""
    reviews = (
        db.query(models.Review)
        .join(models.User)
        .order_by(models.Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for review in reviews:
        review_data = schemas.ReviewRead.from_orm(review)
        review_data.user_name = review.user.name
        result.append(review_data)

    return result


@router.get("/{review_id}", response_model=schemas.ReviewRead)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
):
    """리뷰 상세 조회"""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다.")

    result = schemas.ReviewRead.model_validate(review)
    result.user_name = review.user.name
    return result

