from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.alert import Alert as AlertRow
from app.services.alert_source import AlertSource

BATCH_SIZE = 500
UPDATE_COLUMNS = [
    "timestamp", "src_ip", "dst_ip", "duration", "protocol_type",
    "service", "flag", "predicted_label", "severity", "raw",
]


def sync_alerts(db: Session, source: AlertSource) -> int:
    unique = {a.external_id: a for a in source.fetch_alerts()}
    alerts = list(unique.values())

    for start in range(0, len(alerts), BATCH_SIZE):
        rows = []
        for a in alerts[start:start + BATCH_SIZE]:
            row = a.model_dump(exclude={"id"})
            row["raw"] = a.model_dump(mode="json")
            rows.append(row)

        stmt = insert(AlertRow).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=[AlertRow.external_id],
            set_={col: stmt.excluded[col] for col in UPDATE_COLUMNS},
        )
        db.execute(stmt)

    db.commit()
    return len(alerts)