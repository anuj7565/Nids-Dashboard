@"
# nids-dashboard

A full-stack security alert dashboard that consumes the alerts from my
Network Intrusion Detection System.

**Status:** in development (10-day sprint)

## Planned stack
FastAPI, PostgreSQL, SQLAlchemy, JWT auth, React, Docker
"@ | Set-Content -Path README.md -Encoding utf8

## Security notes

### Frontend token storage

The frontend keeps the JWT in `localStorage` so a page refresh does not log the user out. Any JavaScript running on the page can read `localStorage`, so a cross-site scripting (XSS) bug could expose the token. Mitigations in place: tokens expire after 30 minutes, and React escapes rendered values by default.

A stronger alternative is an `httpOnly`, `Secure`, `SameSite` cookie set by the backend, which page scripts cannot read. It would also need CSRF protection and credentialed CORS, so it is listed as future work.