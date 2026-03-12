from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # income, expense, transfer
    description = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    source = Column(String, default="manual")  # manual, import
    notes = Column(String, nullable=True)
    # Recurring
    is_recurring = Column(Boolean, default=False)
    recurrence_interval = Column(String, nullable=True)  # monthly, weekly, yearly
    recurrence_end_date = Column(Date, nullable=True)
    parent_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    goal = relationship("Goal", back_populates="transactions")
    document = relationship("Document", back_populates="transactions")
    children = relationship("Transaction", back_populates="parent")
    parent = relationship("Transaction", back_populates="children", remote_side=[id])
