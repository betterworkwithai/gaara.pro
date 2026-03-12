from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="processing")  # processing, done, error
    document_type = Column(String, nullable=False)  # credit_card, bank_statement
    raw_text = Column(Text, nullable=True)
    extracted_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="documents")
    transactions = relationship("Transaction", back_populates="document")
