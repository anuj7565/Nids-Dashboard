from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    src_ip: Mapped[str] = mapped_column(String(45), index=True)
    dst_ip: Mapped[str] = mapped_column(String(45))
    duration: Mapped[float] = mapped_column(Float)
    protocol_type: Mapped[str] = mapped_column(String(16))
    service: Mapped[str] = mapped_column(String(32))
    flag: Mapped[str] = mapped_column(String(16))
    predicted_label: Mapped[str] = mapped_column(String(16))
    severity: Mapped[str] = mapped_column(String(16), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True, default="new")
    raw: Mapped[dict] = mapped_column(JSON)