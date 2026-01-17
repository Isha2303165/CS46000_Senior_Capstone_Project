from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import date


class FileOut(BaseModel):
    id: str
    filename: str
    status: str
    row_count: int = 0


class TransactionOut(BaseModel):
    id: str
    date: Optional[date]
    amount: Optional[float]
    category: Optional[str]
    description: Optional[str]


class BudgetItemIn(BaseModel):
    user_id: str
    name: str
    amount: float
    frequency: str  # monthly/yearly/etc.


class SummaryOut(BaseModel):
    user_id: str
    monthly_income: float = 0.0
    monthly_expenses: float = 0.0
    savings_rate: float = 0.0
    categories: Dict[str, float] = Field(default_factory=dict)
