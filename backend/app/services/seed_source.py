import json
from pathlib import Path

from app.schemas.alert import Alert
from app.services.alert_source import AlertSource
from app.services.nids_format import rows_to_alerts


class SeedFileSource(AlertSource):
    def __init__(self, path: str):
        self.path = Path(path)

    def fetch_alerts(self) -> list[Alert]:
        with open(self.path, encoding="utf-8") as f:
            data = json.load(f)
        return rows_to_alerts(data["alerts"])