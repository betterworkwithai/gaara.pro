from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[date] = None
    color: str = "#F97316"
    icon: str = "🎯"


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[date] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_completed: Optional[bool] = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: Optional[date]
    color: str
    icon: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
