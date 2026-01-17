from pymongo import MongoClient
from .config import settings  # assumes package name 'app', see app.py below


client = MongoClient(settings.MONGO_URL)
db = client[settings.MONGO_DB]


def get_db():
    return db
