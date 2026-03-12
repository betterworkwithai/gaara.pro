from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BudgetCreate(BaseModel):
    category_id: int
    amount: float
    month: int  # 1-12
    year: int


class BudgetUpdate(BaseModel):
    amount: Optional[float] = None


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    amount: float
    month: int
    year: int
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetWithSpending(BudgetResponse):
    spent: float
    remaining: float
    percentage: float
    category_name: str
    category_color: str
    category_icon: str
