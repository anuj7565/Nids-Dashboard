from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SensorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class SensorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    key_prefix: str
    created_at: datetime
    revoked_at: datetime | None
    last_seen_at: datetime | None


class SensorCreated(SensorOut):
    # Only the create response includes this. It is never shown again.
    key: str