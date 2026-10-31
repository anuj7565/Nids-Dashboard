from app.core.config import settings
from app.services.alert_source import AlertSource
from app.services.nids_source import NidsHttpSource
from app.services.seed_source import SeedFileSource


def get_alert_source() -> AlertSource:
    if settings.alert_source == "nids":
        return NidsHttpSource(settings.nids_api_url)
    if settings.alert_source == "seed":
        return SeedFileSource(settings.seed_file)
    raise ValueError(f"Unknown ALERT_SOURCE: {settings.alert_source}")