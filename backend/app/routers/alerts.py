from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.alert import Alert as AlertRow
from app.schemas.alert import Alert, AlertPage

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
    db: Session = Depends(get_db),
):
    filters = []
    if severity:
        filters.append(AlertRow.severity == severity)
    if status:
        filters.append(AlertRow.status == status)
    if q:
        filters.append(
            or_(
                AlertRow.src_ip.contains(q, autoescape=True),
                AlertRow.dst_ip.contains(q, autoescape=True),
            )
        )
    if from_:
        filters.append(AlertRow.timestamp >= as_utc(from_))
    if to:
        filters.append(AlertRow.timestamp <= as_utc(to))

    total = db.scalar(select(func.count()).select_from(AlertRow).where(*filters))
    rows = db.scalars(
        select(AlertRow)
        .where(*filters)
        .order_by(AlertRow.timestamp.desc(), AlertRow.id.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    ).all()

    return AlertPage(
        items=[Alert.model_validate(r, from_attributes=True) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )
@router.get("/{alert_id}", response_model=Alert)

@router.get("/stats")
def alert_stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(AlertRow))

    by_severity = dict(
        db.execute(
            select(AlertRow.severity, func.count()).group_by(AlertRow.severity)
        ).all()
    )
    by_status = dict(
        db.execute(
            select(AlertRow.status, func.count()).group_by(AlertRow.status)
        ).all()
    )

    return {
        "total": total,
        "by_severity": {s: by_severity.get(s, 0) for s in ["low", "medium", "high", "critical"]},
        "by_status": {s: by_status.get(s, 0) for s in ["new", "acknowledged"]},
    }

    
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    row = db.get(AlertRow, alert_id)
    if row is None:
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "NOT_FOUND", "message": f"Alert {alert_id} not found"}},
        )
    return Alert.model_validate(row, from_attributes=True)