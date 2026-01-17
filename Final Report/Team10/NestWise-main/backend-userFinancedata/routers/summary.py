from fastapi import APIRouter
from models.schemas import SummaryOut
from models import crud

summaryRouter = APIRouter()


@router.get("/", response_model=SummaryOut)
def get_summary(user_id: str):
    summary = crud.get_summary_for_user(user_id)
    return SummaryOut(**summary)
