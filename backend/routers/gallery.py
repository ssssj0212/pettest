from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_admin_user

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.post("", response_model=schemas.GalleryRead)
def create_gallery_item(
    gallery_in: schemas.GalleryCreate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """갤러리 이미지 추가 (관리자만)"""
    gallery = models.Gallery(
        image_url=gallery_in.image_url,
        caption=gallery_in.caption,
    )
    db.add(gallery)
    db.commit()
    db.refresh(gallery)
    return gallery


@router.get("", response_model=List[schemas.GalleryRead])
def list_gallery(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """갤러리 목록 조회 (인증 불필요)"""
    gallery_items = (
        db.query(models.Gallery)
        .filter(models.Gallery.is_active == True)  # noqa: E712
        .order_by(models.Gallery.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return gallery_items


@router.get("/{gallery_id}", response_model=schemas.GalleryRead)
def get_gallery_item(
    gallery_id: int,
    db: Session = Depends(get_db),
):
    """갤러리 항목 상세 조회"""
    gallery = (
        db.query(models.Gallery)
        .filter(models.Gallery.id == gallery_id, models.Gallery.is_active == True)  # noqa: E712
        .first()
    )
    if not gallery:
        raise HTTPException(status_code=404, detail="갤러리 항목을 찾을 수 없습니다.")
    return gallery


@router.delete("/{gallery_id}")
def delete_gallery_item(
    gallery_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """갤러리 항목 삭제 (관리자만)"""
    gallery = db.query(models.Gallery).filter(models.Gallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="갤러리 항목을 찾을 수 없습니다.")

    gallery.is_active = False
    db.commit()
    return {"message": "갤러리 항목이 삭제되었습니다."}
















