from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    upload_date: datetime
    status: str
    document_type: str

    class Config:
        from_attributes = True


class ExtractedTransaction(BaseModel):
    date: date
    description: str
    amount: float
    type: str  # income, expense
    category_id: Optional[int] = None
    category_name: Optional[str] = None


class ConfirmTransactionsRequest(BaseModel):
    transactions: List[ExtractedTransaction]
