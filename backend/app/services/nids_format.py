from datetime import datetime, timezone

from app.schemas.alert import Alert
from app.services.severity import assign_severities


def rows_to_alerts(rows: list[dict]) -> list[Alert]:
    if not rows:
        return []

    # Run label: timestamp of the first alert in the NIDS database (lowest id)
    run_label = min(rows, key=lambda r: r["id"])["timestamp"]
    severities = assign_severities(rows)

    alerts = []
    for row, severity in zip(rows, severities):
        alerts.append(
            Alert(
                external_id=f"{run_label}-{row['id']}",
                timestamp=datetime.fromtimestamp(row["timestamp"], tz=timezone.utc),
                src_ip=row["src_ip"],
                dst_ip=row["dst_ip"],
                duration=row["duration"],
                protocol_type=row["protocol_type"],
                service=row["service"],
                flag=row["flag"],
                predicted_label=row["predicted_label"],
                severity=severity,
            )
        )
    return alerts