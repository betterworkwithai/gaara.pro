from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class DebtCreate(BaseModel):
    name: str
    total_amount: float
    remaining_amount: float
    interest_rate: float = 0.0  # monthly %
    monthly_payment: float
    due_date: Optional[date] = None
    notes: Optional[str] = None


class DebtUpdate(BaseModel):
    name: Optional[str] = None
    total_amount: Optional[float] = None
    remaining_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    due_date: Optional[date] = None
    is_paid: Optional[bool] = None
    notes: Optional[str] = None


class DebtResponse(BaseModel):
    id: int
    user_id: int
    name: str
    total_amount: float
    remaining_amount: float
    interest_rate: float
    monthly_payment: float
    due_date: Optional[date]
    is_paid: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
