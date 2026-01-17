from datetime import datetime
from bson import ObjectId
from db.db import get_db


def create_file_record(filename: str, user_id: str | None, storage_path: str) -> str:
    db = get_db()
    doc = {
        "user_id": user_id,
        "filename": filename,
        "storage_path": storage_path,
        "status": "pending",
        "row_count": 0,
        "uploaded_at": datetime.utcnow(),
    }
    result = db.files.insert_one(doc)
    return str(result.inserted_id)


def update_file_status(file_id: str, status: str, row_count: int | None = None):
    db = get_db()
    update = {"$set": {"status": status}}
    if row_count is not None:
        update["$set"]["row_count"] = row_count
    db.files.update_one({"_id": ObjectId(file_id)}, update)


def get_file(file_id: str):
    db = get_db()
    doc = db.files.find_one({"_id": ObjectId(file_id)})
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    return doc


def insert_transaction(
    user_id: str | None,
    date,
    amount: float,
    description: str | None,
    category: str | None,
    source_file: str,
):
    db = get_db()
    doc = {
        "user_id": user_id,
        "date": date,
        "amount": amount,
        "description": description,
        "category": category,
        "source_file": source_file,
    }
    db.transactions.insert_one(doc)


def get_transactions_for_user(user_id: str, limit: int = 100, offset: int = 0):
    db = get_db()
    cursor = (
        db.transactions.find({"user_id": user_id})
        .sort("date", -1)
        .skip(offset)
        .limit(limit)
    )
    docs = list(cursor)
    for d in docs:
        d["id"] = str(d["_id"])
    return docs


def get_summary_for_user(user_id: str):
    db = get_db()
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "income": {
                    "$sum": {
                        "$cond": [{"$gte": ["$amount", 0]}, "$amount", 0],
                    }
                },
                "expenses": {
                    "$sum": {
                        "$cond": [{"$lt": ["$amount", 0]}, "$amount", 0],
                    }
                },
            }
        },
    ]
    results = list(db.transactions.aggregate(pipeline))

    categories = {}
    income = 0.0
    expenses = 0.0

    for r in results:
        cat = r["_id"] or "uncategorized"
        categories[cat] = float(r["total"])
        income += float(r["income"])
        expenses += abs(float(r["expenses"]))

    monthly_income = income
    monthly_expenses = expenses
    savings_rate = (
        (monthly_income - monthly_expenses) / monthly_income if monthly_income > 0 else 0.0
    )

    return {
        "user_id": user_id,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "savings_rate": savings_rate,
        "categories": categories,
    }
