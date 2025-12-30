from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderRead)
def create_order(
    order_in: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """주문 생성"""
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="주문 항목이 없습니다.",
        )

    # 상품 확인 및 총액 계산
    total_amount = Decimal("0")
    order_items_data = []

    for item in order_in.items:
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)

        if not product_id or quantity < 1:
            continue

        product = (
            db.query(models.Product)
            .filter(
                models.Product.id == product_id,
                models.Product.is_active == True,  # noqa: E712
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"상품 ID {product_id}를 찾을 수 없습니다.",
            )

        unit_price = product.price
        item_total = unit_price * quantity
        total_amount += item_total

        order_items_data.append({
            "product_id": product_id,
            "quantity": quantity,
            "unit_price": unit_price,
        })

    if total_amount == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="주문 총액이 0입니다.",
        )

    # 주문 생성
    order = models.Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="PENDING",
        payment_method=order_in.payment_method,
        payment_status="PENDING",
    )
    db.add(order)
    db.flush()  # order.id를 얻기 위해

    # 주문 항목 생성
    for item_data in order_items_data:
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)

    # 주문 항목 포함하여 반환
    order_items = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.order_id == order.id)
        .all()
    )

    result = schemas.OrderRead.model_validate(order)
    result.items = [schemas.OrderItemRead.model_validate(item) for item in order_items]
    return result


@router.get("", response_model=List[schemas.OrderRead])
def list_orders(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """내 주문 목록 조회"""
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
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


@router.get("/{order_id}", response_model=schemas.OrderRead)
def get_order(
    order_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """주문 상세 조회"""
    order = (
        db.query(models.Order)
        .filter(
            models.Order.id == order_id,
            models.Order.user_id == current_user.id,
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")

    order_items = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.order_id == order.id)
        .all()
    )

    result = schemas.OrderRead.model_validate(order)
    result.items = [schemas.OrderItemRead.model_validate(item) for item in order_items]
    return result


@router.post("/{order_id}/payment")
def process_payment(
    order_id: int,
    payment_data: schemas.PaymentIntentCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """결제 처리 (카드/Venmo/현금)"""
    order = (
        db.query(models.Order)
        .filter(
            models.Order.id == order_id,
            models.Order.user_id == current_user.id,
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")

    if order.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 처리된 주문입니다.",
        )

    payment_method = payment_data.payment_method.upper()

    if payment_method == "CASH":
        # 현금 결제: 바로 완료 처리
        order.status = "PAID"
        order.payment_status = "COMPLETED"
        order.payment_method = "CASH"
        db.commit()
        return {
            "message": "현금 결제가 완료되었습니다.",
            "order_id": order.id,
            "status": "PAID",
        }

    elif payment_method == "VENMO":
        # Venmo: 별도 링크 생성 (실제로는 Venmo API 연동 필요)
        order.payment_method = "VENMO"
        order.payment_status = "PENDING"
        db.commit()
        return {
            "message": "Venmo 결제 링크가 생성되었습니다.",
            "order_id": order.id,
            "payment_url": f"https://venmo.com/pay?order={order.id}",  # 예시
            "status": "PENDING",
        }

    elif payment_method == "CARD":
        # 카드 결제: Stripe 결제 intent 생성 (실제로는 Stripe API 연동 필요)
        order.payment_method = "CARD"
        order.payment_status = "PENDING"
        # TODO: Stripe Payment Intent 생성
        # payment_intent = stripe.PaymentIntent.create(...)
        # order.payment_intent_id = payment_intent.id
        db.commit()
        return {
            "message": "카드 결제 intent가 생성되었습니다.",
            "order_id": order.id,
            "client_secret": "sk_test_...",  # 실제로는 Stripe에서 받은 값
            "status": "PENDING",
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 결제 방법입니다.",
        )




