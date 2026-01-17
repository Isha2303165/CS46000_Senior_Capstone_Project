from fastapi import APIRouter, Query
from typing import List
from models.schemas import TransactionOut
from models import crud

transactionsRouter = APIRouter()


@router.get("/", response_model=List[TransactionOut])
def list_transactions(user_id: str, limit: int = Query(100, le=1000), offset: int = 0):
    docs = crud.get_transactions_for_user(user_id, limit=limit, offset=offset)
    out: list[TransactionOut] = []
    for d in docs:
        out.append(
            TransactionOut(
                id=d["id"],
                date=d.get("date"),
                amount=float(d["amount"]) if d.get("amount") is not None else None,
                category=d.get("category"),
                description=d.get("description"),
            )
        )
    return out
