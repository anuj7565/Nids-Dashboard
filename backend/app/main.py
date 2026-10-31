from fastapi import FastAPI
from app.routers import alerts

app = FastAPI(title="NIDS Dashboard API")
app.include_router(alerts.router)


@app.get("/health")
def health():
    return {"status": "ok"}