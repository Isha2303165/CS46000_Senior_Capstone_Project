import uuid
from sqlalchemy import Column, String, Date, Numeric, Text, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime


Base = declarative_base()


class File(Base):
__tablename__ = "files"
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
user_id = Column(UUID(as_uuid=True), nullable=True)
filename = Column(String, nullable=False)
uploaded_at = Column(TIMESTAMP, default=datetime.utcnow)
status = Column(String, default="pending")
storage_path = Column(String)
row_count = Column(Integer, default=0)


class Transaction(Base):
__tablename__ = "transactions"
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
user_id = Column(UUID(as_uuid=True), nullable=True)
date = Column(Date)
amount = Column(Numeric)
category = Column(String)
description = Column(Text)
source_file = Column(UUID(as_uuid=True), ForeignKey("files.id"))


class BudgetItem(Base):
__tablename__ = "budget_items"
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
user_id = Column(UUID(as_uuid=True), nullable=False)
name = Column(String, nullable=False)
amount = Column(Numeric, nullable=False)
frequency = Column(String, nullable=False) # monthly/yearly