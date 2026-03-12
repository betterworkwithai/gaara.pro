import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.user import User
from app.schemas.document import DocumentResponse, ConfirmTransactionsRequest
from app.core.dependencies import get_current_user
from app.services.ai_service import extract_transactions_from_pdf, categorize_transactions

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.upload_date.desc()).all()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),  # credit_card, bank_statement
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    file_bytes = await file.read()

    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        document_type=document_type,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        # Extract transactions directly from PDF with Claude vision
        transactions = extract_transactions_from_pdf(file_bytes, document_type)

        # Auto-categorize with Claude
        categories = db.query(Category).filter(Category.user_id == current_user.id).all()
        categories_list = [{"id": c.id, "name": c.name, "type": c.type} for c in categories]
        transactions = categorize_transactions(transactions, categories_list)

        doc.extracted_json = json.dumps(transactions, ensure_ascii=False, default=str)
        doc.status = "done"
        db.commit()

        return {
            "document_id": doc.id,
            "filename": doc.filename,
            "status": "done",
            "transactions": transactions,
            "count": len(transactions),
        }
    except Exception as e:
        doc.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Erro ao processar PDF: {str(e)}")


@router.get("/{document_id}/transactions")
def get_document_transactions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    transactions = json.loads(doc.extracted_json) if doc.extracted_json else []
    return {"document_id": doc.id, "transactions": transactions}


@router.post("/{document_id}/confirm")
def confirm_transactions(
    document_id: int,
    data: ConfirmTransactionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    created = []
    for t in data.transactions:
        transaction = Transaction(
            user_id=current_user.id,
            amount=t.amount,
            type=t.type,
            description=t.description,
            date=t.date,
            category_id=t.category_id,
            document_id=document_id,
            source="import",
        )
        db.add(transaction)
        created.append(transaction)

    db.commit()
    return {"created": len(created), "message": f"{len(created)} transações importadas com sucesso"}
