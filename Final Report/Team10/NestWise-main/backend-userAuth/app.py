from fastapi import FastAPI
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
import os

from routers.userAuth import authRouter

app = FastAPI(title="NestWise UserAuth Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("MONGO_DB_AUTH", "nestwise_auth")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
users_collection = db["users"]

# Inject users_collection into controllers so they can use it
import controllers.userAuth as userAuthController
userAuthController.users_collection = users_collection

@app.get("/")
def root():
    return {"service": "UserAuth", "status": "running"}

app.include_router(authRouter, prefix="/userauth")
