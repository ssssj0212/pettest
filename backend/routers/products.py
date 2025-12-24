from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas, models

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[schemas.ProductRead])
def list_products(db: Session = Depends(get_db)):
    """상품 목록 조회 (인증 불필요)"""
    products = (
        db.query(models.Product)
        .filter(models.Product.is_active == True)  # noqa: E712
        .order_by(models.Product.created_at.desc())
        .all()
    )
    return products


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """상품 상세 조회"""
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id == product_id,
            models.Product.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
    return product

