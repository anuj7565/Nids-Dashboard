# nids-dashboard API Specification

Status: draft, written before implementation.

## Conventions

- **Format:** all requests and responses are JSON.
- **Auth:** protected routes need the header `Authorization: Bearer <JWT>`.
- **Timestamps:** ISO 8601 in UTC, e.g. `2026-10-27T14:03:22Z`. The NIDS API returns Unix seconds; the sync service converts them.
- **Pagination:** list endpoints take `page` (default 1) and `page_size` (default 20, max 100), and return:
  `{"items": [...], "total": 1542, "page": 1, "page_size": 20}`
- **Errors:** every error response has this shape:
  `{"error": {"code": "ALERT_NOT_FOUND", "message": "Alert 42 does not exist"}}`
- **Status codes:** 200 OK, 201 Created, 400 bad input, 401 missing or invalid token, 403 valid token but wrong role, 404 not found, 409 conflict, 422 validation failed, 429 rate limited.

## Roles

- `analyst`: can view, filter and acknowledge alerts.
- `admin`: everything an analyst can do, plus user management and NIDS sync.
- Public registration only ever creates `analyst`. The first `admin` is created by a bootstrap script, never through the API.

## Auth

### POST /auth/register
Public. Creates an analyst account.

Request:
{"email": "a@example.com", "username": "anuj", "password": "min 8 chars"}

Response 201:
{"id": 1, "email": "a@example.com", "username": "anuj", "role": "analyst"}

Errors: 409 `EMAIL_TAKEN` or `USERNAME_TAKEN`, 422 invalid input (bad email, short password).

### POST /auth/login
Public. Rate limited (429 `RATE_LIMITED` after repeated attempts).

Request:
{"email": "a@example.com", "password": "..."}

Response 200:
{"access_token": "<JWT>", "token_type": "bearer"}

Errors: 401 `INVALID_CREDENTIALS` (same message whether the email or the password was wrong), 429.

### GET /auth/me
Any logged-in user.

Response 200:
{"id": 1, "email": "a@example.com", "username": "anuj", "role": "analyst"}

Errors: 401 missing, expired or invalid token.

## Alerts

All alert routes require login (analyst or admin).

Alert object:
{
  "id": 17,
  "external_id": "1204",
  "timestamp": "2026-10-27T14:03:22Z",
  "src_ip": "192.168.201.128",
  "dst_ip": "192.168.201.129",
  "duration": 0,
  "protocol_type": "tcp",
  "service": "private",
  "flag": "S0",
  "predicted_label": "ATTACK",
  "severity": "high",
  "status": "new"
}

### GET /alerts
Query params (all optional): `severity` (low|medium|high|critical), `status` (new|acknowledged), `from` and `to` (ISO 8601 dates), `q` (matches src_ip or dst_ip), `page`, `page_size`.
Sorted newest first.

Response 200: paginated list (see Conventions) of alert objects.
Errors: 401, 422 (e.g. unknown severity value).

### GET /alerts/{id}
Response 200: the alert object plus `"raw": {...}` (the original NIDS record) and `"acknowledgements": [{"user": "anuj", "note": "...", "created_at": "..."}]`.
Errors: 401, 404 `ALERT_NOT_FOUND`.

### POST /alerts/{id}/acknowledge
Request: {"note": "Confirmed Nmap scan from lab Kali VM"}  (note is optional)
Response 200: the updated alert object with `"status": "acknowledged"`.
Errors: 401, 404 `ALERT_NOT_FOUND`, 409 `ALREADY_ACKNOWLEDGED`.

### GET /alerts/stats
Response 200:
{
  "total": 1542,
  "by_severity": {"low": 300, "medium": 700, "high": 450, "critical": 92},
  "by_status": {"new": 1500, "acknowledged": 42},
  "per_day": [{"date": "2026-10-27", "count": 1542}]
}

## Admin

All admin routes require the `admin` role. An analyst gets 403 `FORBIDDEN`.

### GET /users
Response 200: paginated list of {"id", "email", "username", "role", "created_at"}.
Errors: 401, 403.

### PATCH /users/{id}/role
Request: {"role": "admin"}  (allowed values: analyst, admin)
Response 200: the updated user.
Errors: 401, 403, 404 `USER_NOT_FOUND`, 422 invalid role, 409 `LAST_ADMIN` (cannot demote the only remaining admin).

### POST /admin/sync
Pulls alerts from the configured alert source and upserts them by `external_id`. Running it twice never creates duplicates.
Response 200: {"fetched": 1542, "inserted": 1500, "updated": 42}
Errors: 401, 403, 502 `SOURCE_UNAVAILABLE` (the NIDS API could not be reached).

## Health

### GET /health
Public.
Response 200: {"status": "ok"}

## Role-permission table

| Endpoint | Public | Analyst | Admin |
|---|---|---|---|
| GET /health | yes | yes | yes |
| POST /auth/register | yes | yes | yes |
| POST /auth/login | yes | yes | yes |
| GET /auth/me | no (401) | yes | yes |
| GET /alerts | no (401) | yes | yes |
| GET /alerts/{id} | no (401) | yes | yes |
| GET /alerts/stats | no (401) | yes | yes |
| POST /alerts/{id}/acknowledge | no (401) | yes | yes |
| GET /users | no (401) | no (403) | yes |
| PATCH /users/{id}/role | no (401) | no (403) | yes |
| POST /admin/sync | no (401) | no (403) | yes |