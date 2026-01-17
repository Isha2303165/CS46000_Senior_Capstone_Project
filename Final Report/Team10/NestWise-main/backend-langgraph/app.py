from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.chatBot import chatRouter
from routers.textizer import textizer_router       
import os


app = FastAPI(title="LangGraph Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Adjust later for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"message": "LangGraph backend running"}


# Routers
app.include_router(chatRouter, prefix="/chatbot", tags=["chatBot"])
app.include_router(textizer_router, prefix="/textizer", tags=["textizer"])  
