from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional
from datetime import date
from app.database import get_db
from app.models.transaction import Transaction
from app.models.investment import Investment
from app.models.debt import Debt
from app.models.goal import Goal
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.finance_service import (
    get_monthly_summary,
    get_expenses_by_category,
    calculate_health_score,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    month: int = Query(default=date.today().month),
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_monthly_summary(db, current_user.id, month, year)
    by_category = get_expenses_by_category(db, current_user.id, month, year)
    health = calculate_health_score(db, current_user.id)

    # Recent transactions
    recent = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    recent_list = [
        {
            "id": t.id,
            "description": t.description,
            "amount": t.amount,
            "type": t.type,
            "date": t.date.isoformat(),
            "category": {
                "name": t.category.name if t.category else "Sem categoria",
                "color": t.category.color if t.category else "#6B7280",
                "icon": t.category.icon if t.category else "💰",
            },
        }
        for t in recent
    ]

    # Active debts summary
    active_debts = db.query(Debt).filter(
        Debt.user_id == current_user.id,
        Debt.is_paid == False,
    ).all()

    # Active goals summary
    active_goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.is_completed == False,
    ).limit(3).all()

    goals_list = [
        {
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "progress": round((g.current_amount / g.target_amount * 100) if g.target_amount > 0 else 0, 1),
            "color": g.color,
            "icon": g.icon,
        }
        for g in active_goals
    ]

    # Investments total
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    total_invested = sum(i.amount_invested for i in investments)
    total_current = sum(i.current_value for i in investments)

    # Subscriptions (recurring expenses)
    subscriptions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.is_recurring == True,
            Transaction.type == "expense",
        )
        .all()
    )
    total_subscriptions = sum(t.amount for t in subscriptions)

    return {
        "month": month,
        "year": year,
        "summary": summary,
        "health_score": health,
        "expenses_by_category": by_category[:8],
        "recent_transactions": recent_list,
        "debts": {
            "total": sum(d.remaining_amount for d in active_debts),
            "monthly_payment": sum(d.monthly_payment for d in active_debts),
            "count": len(active_debts),
        },
        "investments": {
            "total_invested": total_invested,
            "current_value": total_current,
            "gain": total_current - total_invested,
            "gain_percentage": round(
                ((total_current - total_invested) / total_invested * 100) if total_invested > 0 else 0, 2
            ),
        },
        "goals": goals_list,
        "subscriptions_monthly": total_subscriptions,
    }
