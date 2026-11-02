from fastapi import FastAPI
from app.routers import alerts
from app.routers import auth
from app.routers import users
from app.routers import admin
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="NIDS Dashboard API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(alerts.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok"}