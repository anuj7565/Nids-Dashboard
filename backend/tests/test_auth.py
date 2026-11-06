from app.core.limiter import limiter

from .conftest import ANALYST_EMAIL, PASSWORD


def test_login_success_returns_token(client, analyst):
    r = client.post("/auth/login", data={"username": ANALYST_EMAIL, "password": PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_is_generic_401(client, analyst):
    r = client.post("/auth/login", data={"username": ANALYST_EMAIL, "password": "wrong-password"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"
    assert r.json()["error"]["message"] == "Incorrect email or password"


def test_login_unknown_email_gives_same_401(client):
    r = client.post("/auth/login", data={"username": "nobody@test.com", "password": PASSWORD})
    assert r.status_code == 401
    assert r.json()["error"]["message"] == "Incorrect email or password"


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_returns_current_user(client, analyst_headers):
    r = client.get("/auth/me", headers=analyst_headers)
    assert r.status_code == 200
    assert r.json()["email"] == ANALYST_EMAIL


def test_alert_routes_require_token(client):
    assert client.get("/alerts").status_code == 401
    assert client.get("/alerts/stats").status_code == 401
    assert client.get("/alerts/over-time").status_code == 401


def test_analyst_forbidden_on_admin_routes(client, analyst_headers):
    r = client.get("/users", headers=analyst_headers)
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"
    assert client.post("/admin/sync", headers=analyst_headers).status_code == 403


def test_admin_can_list_users(client, admin_headers):
    r = client.get("/users", headers=admin_headers)
    assert r.status_code == 200


def test_login_rate_limit_returns_429(client, analyst):
    limiter.enabled = True
    limiter.reset()
    try:
        codes = [
            client.post("/auth/login", data={"username": ANALYST_EMAIL, "password": "bad"}).status_code
            for _ in range(6)
        ]
        assert codes[:5] == [401] * 5
        assert codes[5] == 429
    finally:
        limiter.reset()