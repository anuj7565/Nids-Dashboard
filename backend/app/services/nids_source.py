import httpx

from app.schemas.alert import Alert
from app.services.alert_source import AlertSource
from app.services.nids_format import rows_to_alerts


class SourceUnavailableError(Exception):
    pass


class NidsHttpSource(AlertSource):
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def fetch_alerts(self) -> list[Alert]:
        try:
            response = httpx.get(
                f"{self.base_url}/alerts",
                params={"label": "all"},
                timeout=10,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise SourceUnavailableError(f"NIDS API unreachable: {exc}") from exc
        return rows_to_alerts(response.json()["alerts"])