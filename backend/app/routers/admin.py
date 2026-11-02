from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
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