from jose import JWTError, jwt
from datetime import datetime, timedelta
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException
import os

# DB INJECTION (set from app.py)#
users_collection = None


pwd_hasher = PasswordHasher()

SECRET_KEY = os.getenv("AUTH_JWT_SECRET")
ALGORITHM = os.getenv("AUTH_JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("AUTH_JWT_EXPIRE_MINUTES"))


def get_password_hash(password: str) -> str:
    return pwd_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_hasher.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(email: str, password: str):
    user = users_collection.find_one({"email": email})
    if user and verify_password(password, user["hashed_password"]):
        return user
    return None


def create_user(email: str, name: str, password: str):
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(password)
    user_data = {
        "email": email,
        "name": name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = users_collection.insert_one(user_data)

    return {
        "message": "User created successfully",
        "user_id": str(result.inserted_id),
        "email": email,
        "name": name
    }


def get_user_by_email(email: str):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user["email"],
        "name": user.get("name", ""),
        "user_id": str(user["_id"])
    }


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def update_user_profile(current_email: str, new_email: str = None, new_name: str = None):
    """
    Update user profile fields (email, name).
    """

    user = users_collection.find_one({"email": current_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {"updated_at": datetime.utcnow()}

    # Only update what was provided
    if new_email and new_email != current_email:
        # Check existing email
        if users_collection.find_one({"email": new_email}):
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = new_email
    
    if new_name:
        update_data["name"] = new_name

    # No update fields provided
    if len(update_data.keys()) == 1:  # only updated_at
        raise HTTPException(status_code=400, detail="Nothing to update")

    users_collection.update_one(
        {"email": current_email},
        {"$set": update_data}
    )

    # Return updated values
    return users_collection.find_one({"email": update_data.get("email", current_email)})
