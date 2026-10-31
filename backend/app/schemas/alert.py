from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class Alert(BaseModel):
    id: int | None = None
    external_id: str
    timestamp: datetime
    src_ip: str
    dst_ip: str
    duration: float
    protocol_type: str
    service: str
    flag: str
    predicted_label: Literal["ATTACK", "NORMAL"]
    severity: Literal["low", "medium", "high", "critical"]
    status: Literal["new", "acknowledged"] = "new"

    

class AlertPage(BaseModel):
    items: list[Alert]
    total: int
    page: int
    page_size: int