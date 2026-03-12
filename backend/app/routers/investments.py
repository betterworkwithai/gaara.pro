from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.investment import Investment
from app.models.user import User
from app.schemas.investment import InvestmentCreate, InvestmentUpdate, InvestmentResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/investments", tags=["investments"])


@router.get("", response_model=List[InvestmentResponse])
def list_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Investment).filter(Investment.user_id == current_user.id).all()


@router.post("", response_model=InvestmentResponse)
def create_investment(
    data: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = Investment(user_id=current_user.id, **data.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: int,
    data: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investimento não encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inv, field, value)

    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{investment_id}")
def delete_investment(
    investment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investimento não encontrado")
    db.delete(inv)
    db.commit()
    return {"message": "Investimento excluído"}
