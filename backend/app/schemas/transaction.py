from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TransactionCreate(BaseModel):
    amount: float
    type: str  # income, expense, transfer
    description: str
    date: date
    category_id: Optional[int] = None
    goal_id: Optional[int] = None
    notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_interval: Optional[str] = None  # monthly, weekly, yearly
    recurrence_end_date: Optional[date] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    category_id: Optional[int] = None
    goal_id: Optional[int] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_interval: Optional[str] = None
    recurrence_end_date: Optional[date] = None


class CategoryInfo(BaseModel):
    id: int
    name: str
    color: str
    icon: str
    type: str

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    description: str
    date: date
    source: str
    notes: Optional[str]
    category_id: Optional[int]
    goal_id: Optional[int]
    document_id: Optional[int]
    is_recurring: bool
    recurrence_interval: Optional[str]
    recurrence_end_date: Optional[date]
    category: Optional[CategoryInfo] = None
    created_at: datetime

    class Config:
        from_attributes = True
