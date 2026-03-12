from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.debt import Debt
from app.models.user import User
from app.schemas.debt import DebtCreate, DebtUpdate, DebtResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/debts", tags=["debts"])


@router.get("", response_model=List[DebtResponse])
def list_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Debt).filter(Debt.user_id == current_user.id).all()


@router.post("", response_model=DebtResponse)
def create_debt(
    data: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = Debt(user_id=current_user.id, **data.model_dump())
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


@router.put("/{debt_id}", response_model=DebtResponse)
def update_debt(
    debt_id: int,
    data: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = db.query(Debt).filter(
        Debt.id == debt_id,
        Debt.user_id == current_user.id,
    ).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Dívida não encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(debt, field, value)

    db.commit()
    db.refresh(debt)
    return debt


@router.delete("/{debt_id}")
def delete_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = db.query(Debt).filter(
        Debt.id == debt_id,
        Debt.user_id == current_user.id,
    ).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Dívida não encontrada")
    db.delete(debt)
    db.commit()
    return {"message": "Dívida excluída"}
