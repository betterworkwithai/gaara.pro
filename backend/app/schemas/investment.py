from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class InvestmentCreate(BaseModel):
    name: str
    type: str  # acao, fii, renda_fixa, crypto, outro
    amount_invested: float
    current_value: float
    date: date
    notes: Optional[str] = None


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    amount_invested: Optional[float] = None
    current_value: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None


class InvestmentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    amount_invested: float
    current_value: float
    date: date
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
