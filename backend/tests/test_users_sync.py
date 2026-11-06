from sqlalchemy import func, select

from app.models.alert import Alert


def _register(client, email="new@test.com", username="newuser", password="longenough1", **extra):
    return client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": password, **extra},
    )


def test_register_creates_analyst(client):
    r = _register(client)
    assert r.status_code in (200, 201)
    assert r.json()["role"] == "analyst"


def test_register_cannot_choose_admin_role(client):
    r = _register(client, role="admin")
    assert r.status_code in (200, 201)
    assert r.json()["role"] == "analyst"


def test_register_duplicate_email_is_409(client):
    assert _register(client).status_code in (200, 201)
    dup = _register(client, username="otheruser")
    assert dup.status_code == 409
    assert dup.json()["error"]["code"] == "CONFLICT"


def test_register_short_password_is_422(client):
    r = _register(client, password="short")
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_admin_can_change_analyst_role(client, admin, admin_headers, analyst, db):
    r = client.patch(
        f"/users/{analyst.id}/role", json={"role": "admin"}, headers=admin_headers
    )
    assert r.status_code == 200
    db.refresh(analyst)
    assert analyst.role == "admin"


def test_admin_cannot_change_own_role(client, admin, admin_headers):
    r = client.patch(
        f"/users/{admin.id}/role", json={"role": "analyst"}, headers=admin_headers
    )
    assert r.status_code == 400


def test_sync_is_idempotent(client, admin_headers, db):
    def count():
        return db.scalar(select(func.count()).select_from(Alert))

    first = client.post("/admin/sync", headers=admin_headers)
    assert first.status_code == 200
    after_first = count()
    assert after_first > 0
    assert first.json()["result"] == after_first

    second = client.post("/admin/sync", headers=admin_headers)
    assert second.status_code == 200
    assert count() == after_first