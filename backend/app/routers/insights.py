from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.investment import Investment
from app.models.debt import Debt
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.finance_service import (
    get_monthly_summary,
    get_expenses_by_category,
    calculate_health_score,
)
from app.services.ai_service import generate_insights

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("")
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    month, year = today.month, today.year

    summary = get_monthly_summary(db, current_user.id, month, year)
    by_category = get_expenses_by_category(db, current_user.id, month, year)
    health = calculate_health_score(db, current_user.id)

    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    active_debts = db.query(Debt).filter(Debt.user_id == current_user.id, Debt.is_paid == False).all()

    total_investments = sum(i.current_value for i in investments)
    total_debt = sum(d.remaining_amount for d in active_debts)
    income = summary["income"]
    expenses = summary["expenses"]
    savings_rate = ((income - expenses) / income * 100) if income > 0 else 0

    ai_insights = generate_insights({
        "health_score": health["score"],
        "income": income,
        "expenses": expenses,
        "savings_rate": round(savings_rate, 1),
        "total_debt": total_debt,
        "total_investments": total_investments,
        "top_categories": by_category[:5],
    })

    return {
        "health_score": health,
        "summary": summary,
        "savings_rate": round(savings_rate, 1),
        "ai_insights": ai_insights,
        "month": month,
        "year": year,
    }
