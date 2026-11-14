# nids-dashboard API Specification

Status: matches the implemented API as of 9 Nov 2026.

## Conventions

- **Format:** requests and responses are JSON, except `POST /auth/login`, which is form-encoded.
- **Auth:** protected routes need the header `Authorization: Bearer <JWT>`.
- **Timestamps:** ISO 8601 in UTC, e.g. `2026-10-27T14:03:22Z`. The NIDS API returns Unix seconds; the sync service converts them.
- **Pagination:** `GET /alerts` takes `page` (default 1) and `page_size` (default 20, max 100), and returns:
  `{"items": [...], "total": 1542, "page": 1, "page_size": 20}`
- **Errors:** every error has this shape. `details` appears only on 422.
  {"error": {"code": "NOT_FOUND", "message": "Alert 42 not found"}}
  The code comes from the HTTP status:
  400 BAD_REQUEST, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 405 METHOD_NOT_ALLOWED, 409 CONFLICT, 422 VALIDATION_ERROR, 429 RATE_LIMITED.
  422 adds {"details": [{"field": "body.email", "message": "..."}]}.
  Not yet implemented: a catch-all handler for unhandled exceptions (INTERNAL_ERROR). Today those return the framework's default 500.
- **Status codes:** 200 OK, 201 Created, 400 bad input, 401 missing or invalid token, 403 valid token but wrong role, 404 not found, 409 conflict, 422 validation failed, 429 rate limited.

## Roles

- `analyst`: can view, filter and acknowledge alerts.
- `admin`: everything an analyst can do, plus user management and NIDS sync.
- Public registration only ever creates `analyst`. The first `admin` is created by a bootstrap script, never through the API.

## Auth

### POST /auth/register
Public. Creates an analyst account.

Request:
{"email": "a@example.com", "username": "3-50 chars", "password": "8-128 chars"}

Response 201:
{"id": 1, "email": "a@example.com", "username": "anuj", "role": "analyst", "created_at": "2026-10-27T14:03:22Z"}

Errors: 409 CONFLICT ("Email or username already registered", one message for both), 422 invalid input.

### POST /auth/login
Public. Rate limited to 5 requests per minute per client IP.

Request: form-encoded (`Content-Type: application/x-www-form-urlencoded`)
username=a@example.com&password=...
(The field is called `username` because of the OAuth2 password form; its value is the account email.)

Response 200:
{"access_token": "<JWT>", "token_type": "bearer"}

Errors: 401 UNAUTHORIZED ("Incorrect email or password", identical whether the email or the password was wrong), 422 missing fields, 429 RATE_LIMITED.

### GET /auth/me
Any logged-in user.

Response 200:
{"id": 1, "email": "a@example.com", "username": "anuj", "role": "analyst", "created_at": "2026-10-27T14:03:22Z"}

Errors: 401 missing, expired or invalid token.

## Alerts

All alert routes require login (analyst or admin).

Alert object:
{
  "id": 17,
  "external_id": "1792680431-1420",
  "timestamp": "2026-10-29T14:25:55Z",
  "src_ip": "203.0.113.20",
  "dst_ip": "192.168.201.129",
  "duration": 0.004552,
  "protocol_type": "tcp",
  "service": "telnet",
  "flag": "REJ",
  "predicted_label": "ATTACK",
  "severity": "high",
  "status": "new"
}

`external_id` has the form `<run label>-<id>` and is unique. It is the key the sync upserts on.

### GET /alerts
Query params (all optional):
- `severity` (low|medium|high|critical)
- `status` (new|acknowledged)
- `q` (substring match on src_ip or dst_ip)
- `from` and `to` (ISO 8601 datetimes; a value with no timezone is treated as UTC; both ends inclusive)
- `page`, `page_size` (see Conventions)

Sorted newest first.

Response 200: paginated list (see Conventions) of alert objects.
Errors: 401, 422 (e.g. unknown severity value, page_size above 100).

### GET /alerts/{id}
Response 200: the alert object (same fields as in the list). The original record and acknowledgement history are stored in the database but not exposed by the API yet.
Errors: 401, 404 NOT_FOUND, 422 (id is not an integer).

### POST /alerts/{id}/acknowledge
Request: {"note": "..."} (note is optional, max 500 characters; longer gives 422)
Response 200: the updated alert object with `"status": "acknowledged"`.
Errors: 401, 404 NOT_FOUND, 409 CONFLICT (already acknowledged), 422.

### GET /alerts/stats
Response 200:
{
  "total": 1542,
  "by_severity": {"low": 300, "medium": 700, "high": 450, "critical": 92},
  "by_status": {"new": 1500, "acknowledged": 42}
}
Errors: 401.

### GET /alerts/over-time
Alert counts per UTC calendar day, oldest first. No parameters. Days with no alerts are omitted.

Response 200:
[{"date": "2026-10-27", "count": 1542}]

Note: days are grouped in UTC, so the chart's day boundaries differ from IST by 5.5 hours.
Declared before /alerts/{id} so "over-time" is not parsed as an id.
Errors: 401.

## Admin

All admin routes require the `admin` role. An analyst gets 403 FORBIDDEN.

### GET /users
Response 200: a JSON array of user objects (`id`, `email`, `username`, `role`, `created_at`), ordered by id (not paginated).
Errors: 401, 403.

### PATCH /users/{id}/role
Request: {"role": "admin"}  (allowed values: analyst, admin)
Response 200: the updated user object.

Rules:
- An admin cannot change their own role (400 BAD_REQUEST). So a demotion always needs a second admin, and the acting admin can never remove their own access.

Errors: 401, 403, 400 (own role), 404 NOT_FOUND ("User not found"), 422 invalid role.

### POST /admin/sync
Pulls alerts from the configured alert source (`ALERT_SOURCE`: the real NIDS API or the simulated seed file) and upserts them into the database by `external_id`. Running it twice never creates duplicates: existing rows are updated, new rows are inserted. Duplicate `external_id` values within one fetch are collapsed to one.

Response 200: {"status": "ok", "result": 1542}
(`result` is the number of unique alerts upserted. It does not split inserted from updated.)

Errors: 401, 403. If the alert source is unreachable the request currently fails with an unhandled 500; a clean 502 is not implemented yet.


### POST /admin/sensors
Registers a new sensor and returns its key. The key is random (`nids_` plus 43 URL-safe characters) and is shown only in this response. The database stores a SHA-256 hash and a 12-character prefix, never the key itself, so a lost key cannot be recovered; revoke the sensor and create a new one.

Request body: {"name": "kali-test"} (1-64 characters)

Response 201: {"id": 1, "name": "kali-test", "key_prefix": "nids_Ab3dE9x", "created_at": "...", "revoked_at": null, "last_seen_at": null, "key": "nids_..."}

Errors: 401, 403, 422.

### GET /admin/sensors
Lists all sensors, including revoked ones, ordered by id. The response is an unpaginated array. It never contains the key or its hash; `key_prefix` is there so an admin can tell sensors apart.

Response 200: [{"id": 1, "name": "kali-test", "key_prefix": "nids_Ab3dE9x", "created_at": "...", "revoked_at": null, "last_seen_at": null}]
(`last_seen_at` stays null until `POST /ingest` exists.)

Errors: 401, 403.

### POST /admin/sensors/{sensor_id}/revoke
Revokes a sensor by setting `revoked_at`. The row is kept for history. Revoking an already revoked sensor returns 409, the same pattern as acknowledge.

Response 200: the sensor object (same fields as the list).

Errors: 401, 403, 404 (unknown id), 409 (already revoked).

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
| GET /alerts/over-time | no (401) | yes | yes |
| POST /alerts/{id}/acknowledge | no (401) | yes | yes |
| GET /users | no (401) | no (403) | yes |
| PATCH /users/{id}/role | no (401) | no (403) | yes |
| POST /admin/sync | no (401) | no (403) | yes |
| POST /admin/sensors | no (401) | no (403) | yes |
| GET /admin/sensors | no (401) | no (403) | yes |
| POST /admin/sensors/{id}/revoke | no (401) | no (403) | yes |

## Severity triage rule

The NIDS model is binary (ATTACK or NORMAL) and produces no severity. The dashboard assigns severity with a fixed, documented rule when alerts are synced. It is a triage heuristic, not a model output.

1. **Base level from the targeted service:**
   - `ssh`, `telnet`: high (remote access)
   - `ftp`, `smtp`, `pop_3`, `imap4`, `http`, `http_443`: medium (data and mail services)
   - everything else, including unnamed ports (`other`): low
2. **Burst bump:** if the same `src_ip` produced 100 or more alerts within 60 seconds, raise the level by one step (low to medium, medium to high, high to critical).
3. **NORMAL alerts** (`predicted_label` = NORMAL) are always `low`.

Limitation: the rule was designed against data from a single Nmap SYN scan, so it has not been validated against other attack types or normal traffic.