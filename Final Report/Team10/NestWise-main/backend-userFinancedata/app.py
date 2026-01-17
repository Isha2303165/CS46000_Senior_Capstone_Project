from fastapi import FastAPI
from routers.files import filesRouter
from routers.transactions import transactionsRouter
from routers.summary import summaryRouter

app = FastAPI(title="User Finance Data Ingest (Mongo)")

app.include_router(filesRouter, prefix="/files", tags=["files"])
app.include_router(summaryRouter, prefix="/files", tags=["files"])
app.include_router(transactionsRouter, prefix="/transactions", tags=["transactions"])   


@app.get("/")
def root():
    return {"status": "ok", "service": "user-finance-ingest"}
