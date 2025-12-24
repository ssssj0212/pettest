from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReservationBase(BaseModel):
    reserved_at: datetime
    memo: Optional[str] = None


class ReservationCreate(ReservationBase):
    pass  # user_id는 현재 로그인한 사용자로 자동 설정


class ReservationUpdate(BaseModel):
    reserved_at: Optional[datetime] = None
    memo: Optional[str] = None
    status: Optional[str] = None


class ReservationRead(ReservationBase):
    id: int
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: int
    user_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemRead] = []

    class Config:
        from_attributes = True




