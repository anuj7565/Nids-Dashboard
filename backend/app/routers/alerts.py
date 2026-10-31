from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.schemas.alert import AlertPage
from app.services.nids_source import SourceUnavailableError
from app.services.source_factory import get_alert_source

router = APIRouter(prefix="/alerts", tags=["alerts"])


def as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


@router.get("", response_model=AlertPage)
def list_alerts(
    severity: Literal["low", "medium", "high", "critical"] | None = None,
    status: Literal["new", "acknowledged"] | None = None,
    q: str | None = None,
    from_: datetime | None = Query(None, alias="from"),
    to: datetime | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    try:
        alerts = get_alert_source().fetch_alerts()
    except SourceUnavailableError as exc:
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "SOURCE_UNAVAILABLE", "message": str(exc)}},
        )

    if severity:
        alerts = [a for a in alerts if a.severity == severity]
    if status:
        alerts = [a for a in alerts if a.status == status]
    if q:
        alerts = [a for a in alerts if q in a.src_ip or q in a.dst_ip]
    if from_:
        alerts = [a for a in alerts if a.timestamp >= as_utc(from_)]
    if to:
        alerts = [a for a in alerts if a.timestamp <= as_utc(to)]

    alerts.sort(key=lambda a: a.timestamp, reverse=True)
    start = (page - 1) * page_size
    return AlertPage(
        items=alerts[start : start + page_size],
        total=len(alerts),
        page=page,
        page_size=page_size,
    )