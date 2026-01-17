from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer


# import models
from models.user import User, Token, UserUpdate


# import contollers
from models.user import User, Token
from controllers.userAuth import (
    authenticate_user,
    create_user,
    get_user_by_email,
    verify_token,
    create_access_token,
    update_user_profile
)

authRouter = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/userauth/signin")

@authRouter.post("/signup", status_code=status.HTTP_201_CREATED)
async def sign_up(user: User):
    return create_user(user.email, user.name, user.password)


@authRouter.post("/signin", response_model=Token)
async def sign_in(user: User):
    db_user = authenticate_user(user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={
        "sub": db_user["email"],
        "name": db_user["name"]
    })
    return {"access_token": access_token, "token_type": "bearer"}


@authRouter.get("/getUser", response_model=dict)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    email = verify_token(token)
    return get_user_by_email(email)


@authRouter.put("/updateUser", response_model=dict)
async def update_user(update: UserUpdate, token: str = Depends(oauth2_scheme)):
    current_email = verify_token(token)

    #Apply profile changes
    updated_user = update_user_profile(
        current_email=current_email,
        new_email=update.new_email,
        new_name=update.new_name
    )

    #ALWAYS return a fresh token if the email or name changed
    new_token = create_access_token(data={
        "sub": updated_user["email"],
        "name": updated_user["name"]
    })

    return {
        "message": "Profile updated successfully",
        "updated_email": updated_user["email"],
        "updated_name": updated_user["name"],
        "new_token": new_token
    }

@authRouter.post("/validateToken")
async def validate_token(token: str = Depends(oauth2_scheme)):
    """
    Validates a JWT token and returns user identity if valid.
    """
    email = verify_token(token)
    user = get_user_by_email(email)

    return {
        "valid": True,
        "email": user["email"],
        "name": user["name"],
        "user_id": user["user_id"]
    }

