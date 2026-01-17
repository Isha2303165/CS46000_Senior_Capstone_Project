from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from controllers.textizer import textizer

textizer_router = APIRouter()

#   MAY NEED TO ADD THIS TO THE MODELS FILE AS A PYDANTIC MODEL
class TextizerRequest(BaseModel):
    profileData: Dict[str, Any]
    lastChatbotResponse: str = ""

@textizer_router.post("/")
async def format_data(request: TextizerRequest):
    formatted_data = textizer(request.profileData, request.lastChatbotResponse)
    return formatted_data