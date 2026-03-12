from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.finance_service import calculate_projections

router = APIRouter(prefix="/api/projections", tags=["projections"])


@router.get("")
def get_projections(
    years: int = Query(default=5, ge=1, le=30),
    income_growth_rate: float = Query(default=0.05, ge=0, le=1),
    expense_growth_rate: float = Query(default=0.03, ge=0, le=1),
    investment_return_rate: float = Query(default=0.10, ge=0, le=1),
    inflation_rate: float = Query(default=0.045, ge=0, le=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return calculate_projections(
        db,
        current_user.id,
        years=years,
        income_growth_rate=income_growth_rate,
        expense_growth_rate=expense_growth_rate,
        investment_return_rate=investment_return_rate,
        inflation_rate=inflation_rate,
    )
