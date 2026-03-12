from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.category import Category, CategoryKeyword
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.parent_id == None,
    ).all()


@router.post("", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = Category(
        user_id=current_user.id,
        name=data.name,
        type=data.type,
        color=data.color,
        icon=data.icon,
        parent_id=data.parent_id,
    )
    db.add(category)
    db.flush()

    for kw in data.keywords:
        db.add(CategoryKeyword(category_id=category.id, keyword=kw.lower()))

    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    update_data = data.model_dump(exclude_unset=True)
    keywords = update_data.pop("keywords", None)

    for field, value in update_data.items():
        setattr(cat, field, value)

    if keywords is not None:
        db.query(CategoryKeyword).filter(CategoryKeyword.category_id == category_id).delete()
        for kw in keywords:
            db.add(CategoryKeyword(category_id=category_id, keyword=kw.lower()))

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    if cat.is_default:
        raise HTTPException(status_code=400, detail="Não é possível excluir categorias padrão")
    db.delete(cat)
    db.commit()
    return {"message": "Categoria excluída"}
