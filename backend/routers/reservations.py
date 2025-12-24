from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=schemas.ReservationRead)
def create_reservation(
    reservation_in: schemas.ReservationCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """예약 생성 (로그인한 사용자만)"""
    # user_id는 현재 로그인한 사용자로 자동 설정
    reservation = models.Reservation(
        user_id=current_user.id,
        reserved_at=reservation_in.reserved_at,
        memo=reservation_in.memo,
        status="BOOKED",
        created_at=datetime.utcnow(),
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("", response_model=List[schemas.ReservationRead])
def list_reservations(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """내 예약 목록 조회 (로그인한 사용자만)"""
    reservations = (
        db.query(models.Reservation)
        .filter(models.Reservation.user_id == current_user.id)
        .order_by(models.Reservation.reserved_at.desc())
        .all()
    )
    return reservations


@router.get("/{reservation_id}", response_model=schemas.ReservationRead)
def get_reservation(
    reservation_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """예약 상세 조회"""
    reservation = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.id == reservation_id,
            models.Reservation.user_id == current_user.id,
        )
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
    return reservation


@router.patch("/{reservation_id}", response_model=schemas.ReservationRead)
def update_reservation(
    reservation_id: int,
    reservation_update: schemas.ReservationUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """예약 변경/취소"""
    reservation = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.id == reservation_id,
            models.Reservation.user_id == current_user.id,
        )
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")

    if reservation_update.reserved_at:
        reservation.reserved_at = reservation_update.reserved_at
    if reservation_update.memo is not None:
        reservation.memo = reservation_update.memo
    if reservation_update.status:
        reservation.status = reservation_update.status

    db.commit()
    db.refresh(reservation)
    return reservation


@router.delete("/{reservation_id}")
def cancel_reservation(
    reservation_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """예약 취소"""
    reservation = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.id == reservation_id,
            models.Reservation.user_id == current_user.id,
        )
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")

    reservation.status = "CANCELED"
    db.commit()
    return {"message": "예약이 취소되었습니다."}

