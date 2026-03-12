from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.finance_service import (
    get_income_vs_expenses_monthly,
    get_expenses_by_category,
    get_cash_flow,
)

router = APIRouter(prefix="/api/charts", tags=["charts"])


@router.get("/income-vs-expenses")
def income_vs_expenses(
    months: int = Query(default=6, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_income_vs_expenses_monthly(db, current_user.id, months)


@router.get("/expenses-by-category")
def expenses_by_category(
    month: int = Query(default=date.today().month),
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_expenses_by_category(db, current_user.id, month, year)


@router.get("/cash-flow")
def cash_flow(
    months: int = Query(default=12, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_cash_flow(db, current_user.id, months)
