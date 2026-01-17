# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.chatBot import chatRouter
from routers.userAuth import authRouter
from routers.textizer import router as textizer_router
from pymongo import MongoClient




app = FastAPI(title="Basic FastAPI App")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"message": "Hello, FastAPI is running!"}

app.include_router(authRouter, prefix="/userauth", tags=["userAuth"])






if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)





# MongoDB setup
client = MongoClient("mongodb://nestwise-mongo:27017/")
db = client["nestwise_db"]
users_collection = db["users"]



# Test MongoDB connection
try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
except Exception as e:
    print("MongoDB connection failed:", e)
