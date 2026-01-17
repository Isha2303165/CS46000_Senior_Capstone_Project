from fastapi import APIRouter, UploadFile, File, HTTPException
from .config import settings
from models import crud
#from tasks import parse_and_store_file
import os

fileRouter = APIRouter()


# @router.post("/", response_model=dict)
# def upload_file(user_id: str | None = None, file: UploadFile = File(...)):
#     os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
#     storage_path = os.path.join(settings.UPLOAD_DIR, file.filename)

#     try:
#         with open(storage_path, "wb") as buffer:
#             buffer.write(file.file.read())
#     except Exception:
#         raise HTTPException(status_code=500, detail="Failed to save file")

#     file_id = crud.create_file_record(file.filename, user_id, storage_path)

#     # enqueue Celery job
#     #parse_and_store_file.delay(file_id, storage_path, user_id)

#     return {"file_id": file_id, "status": "processing"}


@router.get("/{file_id}")
def get_file_status(file_id: str):
    doc = crud.get_file(file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="file not found")
    return {
        "file_id": doc["id"],
        "filename": doc["filename"],
        "status": doc["status"],
        "row_count": doc.get("row_count", 0),
    }
