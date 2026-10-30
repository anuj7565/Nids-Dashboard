from abc import ABC, abstractmethod

from app.schemas.alert import Alert


class AlertSource(ABC):
    @abstractmethod
    def fetch_alerts(self) -> list[Alert]:
        """Return all alerts from this source as Alert objects."""