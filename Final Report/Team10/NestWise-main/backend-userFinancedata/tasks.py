from celery import Celery
from app.config import settings
from app.models import crud
from app.models.parser import parse_csv_file

celery = Celery(
    "userfin_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)


@celery.task(name="parse_and_store_file")
def parse_and_store_file(file_id: str, path: str, user_id: str | None):
    try:
        rows = parse_csv_file(path)
        count = 0
        for row in rows:
            crud.insert_transaction(
                user_id=user_id,
                date=row["date"],
                amount=row["amount"],
                description=row["description"],
                category=row["category"],
                source_file=file_id,
            )
            count += 1
        crud.update_file_status(file_id, "processed", row_count=count)
        return {"status": "ok", "rows": count}
    except Exception:
        crud.update_file_status(file_id, "failed")
        raise
