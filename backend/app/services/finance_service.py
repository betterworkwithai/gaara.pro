from datetime import date, datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.models.investment import Investment
from app.models.debt import Debt
from app.models.budget import Budget
from app.models.goal import Goal
from app.models.category import Category


def get_monthly_summary(db: Session, user_id: int, month: int, year: int) -> Dict[str, Any]:
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .all()
    )

    income = sum(t.amount for t in transactions if t.type == "income")
    expenses = sum(t.amount for t in transactions if t.type == "expense")
    net = income - expenses

    return {
        "income": income,
        "expenses": expenses,
        "net": net,
        "transaction_count": len(transactions),
    }


def get_expenses_by_category(db: Session, user_id: int, month: int, year: int) -> List[Dict]:
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .all()
    )

    category_map: Dict[str, Dict] = {}
    uncategorized = 0.0

    for t in transactions:
        if t.category:
            key = str(t.category_id)
            if key not in category_map:
                category_map[key] = {
                    "id": t.category_id,
                    "name": t.category.name,
                    "color": t.category.color,
                    "icon": t.category.icon,
                    "amount": 0.0,
                }
            category_map[key]["amount"] += t.amount
        else:
            uncategorized += t.amount

    result = list(category_map.values())
    if uncategorized > 0:
        result.append({"id": None, "name": "Sem categoria", "color": "#9CA3AF", "icon": "❓", "amount": uncategorized})

    return sorted(result, key=lambda x: x["amount"], reverse=True)


def get_income_vs_expenses_monthly(db: Session, user_id: int, months: int = 6) -> List[Dict]:
    today = date.today()
    result = []

    for i in range(months - 1, -1, -1):
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1

        summary = get_monthly_summary(db, user_id, month, year)
        month_names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        result.append({
            "month": month_names[month - 1],
            "year": year,
            "income": summary["income"],
            "expenses": summary["expenses"],
        })

    return result


def get_cash_flow(db: Session, user_id: int, months: int = 12) -> List[Dict]:
    data = get_income_vs_expenses_monthly(db, user_id, months)
    running_balance = 0.0
    result = []
    for d in data:
        running_balance += d["income"] - d["expenses"]
        result.append({
            "month": d["month"],
            "year": d["year"],
            "balance": running_balance,
        })
    return result


def calculate_health_score(db: Session, user_id: int) -> Dict[str, Any]:
    today = date.today()
    month, year = today.month, today.year

    summary = get_monthly_summary(db, user_id, month, year)
    income = summary["income"]
    expenses = summary["expenses"]

    # Savings rate score (30%)
    savings_rate = ((income - expenses) / income * 100) if income > 0 else 0
    savings_score = min(100, max(0, savings_rate * 2))  # 50% savings = 100 score

    # Debt-to-income score (25%)
    active_debts = db.query(Debt).filter(Debt.user_id == user_id, Debt.is_paid == False).all()
    total_monthly_debt = sum(d.monthly_payment for d in active_debts)
    dti_ratio = (total_monthly_debt / income * 100) if income > 0 else 100
    debt_score = max(0, 100 - dti_ratio * 2)  # 50% DTI = 0 score

    # Investment score (25%)
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    total_invested = sum(i.amount_invested for i in investments)
    monthly_investment_rate = (total_invested / (income * 12) * 100) if income > 0 else 0
    investment_score = min(100, monthly_investment_rate * 5)  # 20% invested = 100 score

    # Budget adherence score (20%)
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year,
    ).all()

    if budgets:
        adherent = 0
        for b in budgets:
            spent = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.category_id == b.category_id,
                Transaction.type == "expense",
                extract("month", Transaction.date) == month,
                extract("year", Transaction.date) == year,
            ).scalar() or 0
            if spent <= b.amount:
                adherent += 1
        budget_score = (adherent / len(budgets)) * 100
    else:
        budget_score = 50  # neutral if no budgets set

    total_score = int(
        savings_score * 0.30
        + debt_score * 0.25
        + investment_score * 0.25
        + budget_score * 0.20
    )

    if total_score >= 80:
        label = "Excelente"
        color = "#22C55E"
    elif total_score >= 60:
        label = "Bom"
        color = "#3B82F6"
    elif total_score >= 40:
        label = "Regular"
        color = "#F97316"
    else:
        label = "Crítico"
        color = "#EF4444"

    return {
        "score": total_score,
        "label": label,
        "color": color,
        "breakdown": {
            "savings_rate": round(savings_rate, 1),
            "savings_score": round(savings_score),
            "debt_to_income": round(dti_ratio, 1),
            "debt_score": round(debt_score),
            "investment_rate": round(monthly_investment_rate, 1),
            "investment_score": round(investment_score),
            "budget_score": round(budget_score),
        },
    }


def calculate_projections(
    db: Session,
    user_id: int,
    years: int = 5,
    income_growth_rate: float = 0.05,
    expense_growth_rate: float = 0.03,
    investment_return_rate: float = 0.10,
    inflation_rate: float = 0.045,
) -> List[Dict]:
    today = date.today()
    month, year = today.month, today.year

    summary = get_monthly_summary(db, user_id, month, year)
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    debts = db.query(Debt).filter(Debt.user_id == user_id, Debt.is_paid == False).all()

    annual_income = summary["income"] * 12
    annual_expenses = summary["expenses"] * 12
    total_investments = sum(i.current_value for i in investments)
    total_debt = sum(d.remaining_amount for d in debts)
    monthly_debt_payment = sum(d.monthly_payment for d in debts)
    annual_debt_payment = monthly_debt_payment * 12

    projections = []

    for y in range(1, years + 1):
        annual_income *= (1 + income_growth_rate)
        annual_expenses *= (1 + expense_growth_rate)
        savings = annual_income - annual_expenses - annual_debt_payment
        total_investments = total_investments * (1 + investment_return_rate) + max(savings, 0)
        total_debt = max(0, total_debt - annual_debt_payment)
        net_worth = total_investments - total_debt

        projections.append({
            "year": today.year + y,
            "income": round(annual_income, 2),
            "expenses": round(annual_expenses, 2),
            "savings": round(savings, 2),
            "investments": round(total_investments, 2),
            "debt": round(total_debt, 2),
            "net_worth": round(net_worth, 2),
        })

    return projections


def get_goal_monthly_needed(goal: Goal) -> Optional[float]:
    if not goal.target_date:
        return None
    today = date.today()
    months_remaining = (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month)
    if months_remaining <= 0:
        return None
    remaining = goal.target_amount - goal.current_amount
    return round(max(0, remaining / months_remaining), 2)


def suggest_category_by_keywords(db: Session, user_id: int, description: str) -> Optional[int]:
    from app.models.category import CategoryKeyword
    desc_lower = description.lower()
    keywords = db.query(CategoryKeyword).join(Category).filter(Category.user_id == user_id).all()
    for kw in keywords:
        if kw.keyword.lower() in desc_lower:
            return kw.category_id
    return None
