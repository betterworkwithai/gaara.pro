from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CategoryKeywordBase(BaseModel):
    keyword: str


class CategoryKeywordResponse(CategoryKeywordBase):
    id: int

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    type: str  # income, expense, investment, debt
    color: str = "#6B7280"
    icon: str = "💰"
    parent_id: Optional[int] = None
    keywords: List[str] = []


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    keywords: Optional[List[str]] = None


class CategoryResponse(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    color: str
    icon: str
    is_default: bool
    parent_id: Optional[int]
    keywords: List[CategoryKeywordResponse] = []
    subcategories: List["CategoryResponse"] = []

    class Config:
        from_attributes = True


CategoryResponse.model_rebuild()
