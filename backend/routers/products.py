from typing import List
from fastapi import APIRouter, Depends
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

