from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.core.dependencies import get_current_user
from app.services.finance_service import suggest_category_by_keywords

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    type: Optional[str] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if month:
        query = query.filter(extract("month", Transaction.date) == month)
    if year:
        query = query.filter(extract("year", Transaction.date) == year)
    if type:
        query = query.filter(Transaction.type == type)
    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    return query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Auto-suggest category if not provided
    category_id = data.category_id
    if not category_id:
        category_id = suggest_category_by_keywords(db, current_user.id, data.description)

    transaction = Transaction(
        user_id=current_user.id,
        amount=data.amount,
        type=data.type,
        description=data.description,
        date=data.date,
        category_id=category_id,
        goal_id=data.goal_id,
        notes=data.notes,
        is_recurring=data.is_recurring,
        recurrence_interval=data.recurrence_interval,
        recurrence_end_date=data.recurrence_end_date,
    )
    db.add(transaction)

    # Update goal current_amount if linked
    if data.goal_id and data.type == "income":
        from app.models.goal import Goal
        goal = db.query(Goal).filter(Goal.id == data.goal_id, Goal.user_id == current_user.id).first()
        if goal:
            goal.current_amount += data.amount
            if goal.current_amount >= goal.target_amount:
                goal.is_completed = True

    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return t


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(t, field, value)

    db.commit()
    db.refresh(t)
    return t


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    db.delete(t)
    db.commit()
    return {"message": "Transação excluída"}
