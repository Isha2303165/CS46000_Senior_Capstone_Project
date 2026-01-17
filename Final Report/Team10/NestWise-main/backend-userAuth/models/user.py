# models/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional


# Pydantic models
class User(BaseModel):
    email: EmailStr
    password: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str



class UserUpdate(BaseModel):
    new_email: EmailStr | None
    new_name: str | None
