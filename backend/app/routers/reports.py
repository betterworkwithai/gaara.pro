import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import date
from typing import List
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.finance_service import get_monthly_summary, get_expenses_by_category

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/monthly")
def monthly_report(
    month: int = Query(default=date.today().month),
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_monthly_summary(db, current_user.id, month, year)
    by_category = get_expenses_by_category(db, current_user.id, month, year)

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .order_by(Transaction.date)
        .all()
    )

    month_names = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                   "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    return {
        "month": month,
        "month_name": month_names[month - 1],
        "year": year,
        "summary": summary,
        "expenses_by_category": by_category,
        "transactions": [
            {
                "id": t.id,
                "date": t.date.isoformat(),
                "description": t.description,
                "amount": t.amount,
                "type": t.type,
                "category": t.category.name if t.category else "Sem categoria",
            }
            for t in transactions
        ],
    }


@router.get("/yearly")
def yearly_report(
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.finance_service import get_monthly_summary
    month_names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                   "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    months_data = []
    annual_income = 0
    annual_expenses = 0

    for m in range(1, 13):
        s = get_monthly_summary(db, current_user.id, m, year)
        annual_income += s["income"]
        annual_expenses += s["expenses"]
        months_data.append({
            "month": m,
            "month_name": month_names[m - 1],
            "income": s["income"],
            "expenses": s["expenses"],
            "net": s["net"],
        })

    return {
        "year": year,
        "months": months_data,
        "annual_income": annual_income,
        "annual_expenses": annual_expenses,
        "annual_savings": annual_income - annual_expenses,
        "savings_rate": round(
            ((annual_income - annual_expenses) / annual_income * 100) if annual_income > 0 else 0, 1
        ),
    }


@router.get("/tax")
def tax_report(
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.investment import Investment

    # Total income
    income_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income",
            extract("year", Transaction.date) == year,
        )
        .all()
    )
    total_income = sum(t.amount for t in income_transactions)

    # Deductible expenses (health, education)
    all_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            extract("year", Transaction.date) == year,
        )
        .all()
    )

    health_expenses = 0
    education_expenses = 0
    for t in all_transactions:
        if t.category and "saúde" in t.category.name.lower():
            health_expenses += t.amount
        if t.category and "educação" in t.category.name.lower():
            education_expenses += t.amount

    # Investment gains
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    investment_gains = sum(
        max(0, i.current_value - i.amount_invested) for i in investments
    )

    return {
        "year": year,
        "total_income": total_income,
        "deductible_expenses": {
            "health": health_expenses,
            "education": education_expenses,
            "total": health_expenses + education_expenses,
        },
        "investment_gains": investment_gains,
        "income_transactions": [
            {"date": t.date.isoformat(), "description": t.description, "amount": t.amount}
            for t in income_transactions
        ],
    }


@router.get("/export/csv")
def export_csv(
    month: int = Query(default=date.today().month),
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .order_by(Transaction.date)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Data", "Descrição", "Tipo", "Categoria", "Valor (R$)"])

    for t in transactions:
        writer.writerow([
            t.date.strftime("%d/%m/%Y"),
            t.description,
            "Receita" if t.type == "income" else "Despesa",
            t.category.name if t.category else "Sem categoria",
            f"{t.amount:.2f}",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=extrato_{month:02d}_{year}.csv"},
    )
