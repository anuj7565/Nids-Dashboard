from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.core.security import generate_sensor_key
from app.db.session import get_db
from app.models.sensor import Sensor
from app.models.user import User
from app.schemas.sensor import SensorCreate, SensorCreated, SensorOut
from app.services.source_factory import get_alert_source
from app.services.sync_service import sync_alerts

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/sync")
def sync(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    result = sync_alerts(db, get_alert_source())
    return {"status": "ok", "result": result}

@router.post(
    "/sensors", response_model=SensorCreated, status_code=status.HTTP_201_CREATED
)
def create_sensor(
    body: SensorCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    plain_key, key_hash, key_prefix = generate_sensor_key()
    sensor = Sensor(
        name=body.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        created_by=admin.id,
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return SensorCreated(**SensorOut.model_validate(sensor).model_dump(), key=plain_key)


@router.get("/sensors", response_model=list[SensorOut])
def list_sensors(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return db.scalars(select(Sensor).order_by(Sensor.id)).all()


@router.post("/sensors/{sensor_id}/revoke", response_model=SensorOut)
def revoke_sensor(
    sensor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    sensor = db.get(Sensor, sensor_id)
    if sensor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sensor not found")
    if sensor.revoked_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Sensor already revoked")
    sensor.revoked_at = datetime.now(UTC)
    db.commit()
    db.refresh(sensor)
    return sensor