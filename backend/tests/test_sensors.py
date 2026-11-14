import pytest
from sqlalchemy import select

from app.core.security import hash_sensor_key
from app.models.sensor import Sensor

ENDPOINTS = [
    ("post", "/admin/sensors"),
    ("get", "/admin/sensors"),
    ("post", "/admin/sensors/1/revoke"),
]


def _create(client, headers, name="kali-test"):
    return client.post("/admin/sensors", json={"name": name}, headers=headers)


def test_admin_creates_sensor(client, admin_headers):
    r = _create(client, admin_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["key"].startswith("nids_")
    assert body["name"] == "kali-test"
    assert body["revoked_at"] is None
    assert "key_hash" not in body


def test_database_stores_hash_not_key(client, admin_headers, db):
    key = _create(client, admin_headers).json()["key"]
    sensor = db.scalars(select(Sensor)).one()
    assert len(sensor.key_hash) == 64
    assert sensor.key_hash != key
    assert sensor.key_hash == hash_sensor_key(key)
    assert sensor.key_prefix == key[:12]


def test_list_never_exposes_key_or_hash(client, admin_headers):
    _create(client, admin_headers)
    r = client.get("/admin/sensors", headers=admin_headers)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 1
    assert "key" not in rows[0]
    assert "key_hash" not in rows[0]
    assert rows[0]["key_prefix"].startswith("nids_")


def test_revoke_sets_timestamp_then_conflicts(client, admin_headers):
    sensor_id = _create(client, admin_headers).json()["id"]
    first = client.post(f"/admin/sensors/{sensor_id}/revoke", headers=admin_headers)
    assert first.status_code == 200
    assert first.json()["revoked_at"] is not None
    second = client.post(f"/admin/sensors/{sensor_id}/revoke", headers=admin_headers)
    assert second.status_code == 409


def test_revoke_unknown_sensor_is_404(client, admin_headers):
    r = client.post("/admin/sensors/9999/revoke", headers=admin_headers)
    assert r.status_code == 404


def test_empty_name_is_422(client, admin_headers):
    r = client.post("/admin/sensors", json={"name": ""}, headers=admin_headers)
    assert r.status_code == 422


@pytest.mark.parametrize(("method", "path"), ENDPOINTS)
def test_analyst_gets_403(client, analyst_headers, method, path):
    r = getattr(client, method)(path, headers=analyst_headers)
    assert r.status_code == 403


@pytest.mark.parametrize(("method", "path"), ENDPOINTS)
def test_no_token_gets_401(client, method, path):
    r = getattr(client, method)(path)
    assert r.status_code == 401