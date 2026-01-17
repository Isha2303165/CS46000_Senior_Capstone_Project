# models/chat.py
from pydantic import BaseModel

# Pydantic models
class StartResponse(BaseModel):
    session_id: str


class AnswerRequest(BaseModel):
    session_id: str
    message: str


class AnswerResponse(BaseModel):
    response: str
    real_profile: dict | None = None
    conversation_title: str | None = None

class ProfileUpdateRequest(BaseModel):
    session_id: str
    profile: dict