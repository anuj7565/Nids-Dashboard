import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.limiter import limiter
from app.routers import admin, alerts, auth, users

app = FastAPI(title="NIDS Dashboard API")
app.state.limiter = limiter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("app.request")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        ms = (time.perf_counter() - start) * 1000
        logger.exception("%s %s -> 500 (%.0f ms)", request.method, request.url.path, ms)
        raise
    ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s -> %s (%.0f ms)", request.method, request.url.path, response.status_code, ms)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

ERROR_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
}


def error_response(status_code: int, message: str, headers=None, details=None):
    body = {"error": {"code": ERROR_CODES.get(status_code, "ERROR"), "message": message}}
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body, headers=headers)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response(exc.status_code, str(exc.detail), headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = [
        {"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]}
        for e in exc.errors()
    ]
    return error_response(422, "Invalid input", details=details)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return error_response(429, "Too many requests. Try again later.")


app.include_router(alerts.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}