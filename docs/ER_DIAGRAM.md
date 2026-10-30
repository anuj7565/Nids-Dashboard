# Data model

```mermaid
erDiagram
    USERS ||--o{ ACKNOWLEDGEMENTS : writes
    ALERTS ||--o{ ACKNOWLEDGEMENTS : receives

    USERS {
        int id PK
        string email UK
        string username UK
        string password_hash
        string role
        datetime created_at
    }

    ALERTS {
        int id PK
        string external_id UK
        datetime timestamp
        string src_ip
        string dst_ip
        float duration
        string protocol_type
        string service
        string flag
        string predicted_label
        string severity
        string status
        json raw
    }

    ACKNOWLEDGEMENTS {
        int id PK
        int alert_id FK
        int user_id FK
        string note
        datetime created_at
    }
```

## Notes

- `external_id` is `"<run label>-<NIDS id>"`, where the run label is the timestamp of the first alert in the NIDS database. Syncing the same database twice updates rows instead of duplicating them, and a recreated `nids.db` gets a new label, so old and new alerts never collide.
- `severity` is assigned at sync time by the triage rule in `API_SPEC.md`.
- `raw` keeps the original NIDS record as JSON.
- Indexes (added on Day 4) go on the columns the dashboard filters by: `severity`, `status`, `timestamp`, `src_ip`.