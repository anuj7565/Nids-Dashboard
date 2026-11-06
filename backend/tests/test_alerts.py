from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select

from app.models.acknowledgement import Acknowledgement
from app.models.alert import Alert

BASE = datetime(2026, 11, 1, 12, 0, tzinfo=UTC)


@pytest.fixture
def seeded(db):
    """25 alerts: ids 1-5 are high from 203.0.113.9, ids 6-25 are low from 10.0.0.1."""
    rows = []
    for i in range(1, 26):
        high = i <= 5
        rows.append(
            Alert(
                external_id=f"t-{i}",
                timestamp=BASE - timedelta(days=i % 3),
                src_ip="203.0.113.9" if high else "10.0.0.1",
                dst_ip="10.0.0.5",
                duration=1.0,
                protocol_type="tcp",
                service="http",
                flag="S0",
                predicted_label="ATTACK",
                severity="high" if high else "low",
                raw={},
            )
        )
    db.add_all(rows)
    db.commit()


def test_list_pagination(client, analyst_headers, seeded):
    r1 = client.get("/alerts?page=1&page_size=10", headers=analyst_headers).json()
    assert r1["total"] == 25
    assert len(r1["items"]) == 10
    r3 = client.get("/alerts?page=3&page_size=10", headers=analyst_headers).json()
    assert len(r3["items"]) == 5


def test_filter_by_severity(client, analyst_headers, seeded):
    body = client.get("/alerts?severity=high", headers=analyst_headers).json()
    assert body["total"] == 5
    assert all(a["severity"] == "high" for a in body["items"])


def test_filter_by_ip_search(client, analyst_headers, seeded):
    body = client.get("/alerts?q=203.0.113", headers=analyst_headers).json()
    assert body["total"] == 5


def test_invalid_severity_gives_validation_error(client, analyst_headers):
    r = client.get("/alerts?severity=banana", headers=analyst_headers)
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert err["details"]


def test_get_alert_found_and_404(client, analyst_headers, seeded):
    ok = client.get("/alerts/1", headers=analyst_headers)
    assert ok.status_code == 200
    assert ok.json()["id"] == 1
    missing = client.get("/alerts/999", headers=analyst_headers)
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NOT_FOUND"


def test_acknowledge_then_conflict(client, analyst_headers, seeded, db):
    r = client.post("/alerts/1/acknowledge", json={"note": "checked"}, headers=analyst_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "acknowledged"
    assert db.scalar(select(func.count()).select_from(Acknowledgement)) == 1

    again = client.post("/alerts/1/acknowledge", json={"note": "again"}, headers=analyst_headers)
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "CONFLICT"
    assert db.scalar(select(func.count()).select_from(Acknowledgement)) == 1


def test_acknowledge_unknown_alert_404(client, analyst_headers):
    r = client.post("/alerts/999/acknowledge", json={"note": "x"}, headers=analyst_headers)
    assert r.status_code == 404


def test_stats_counts(client, analyst_headers, seeded):
    body = client.get("/alerts/stats", headers=analyst_headers).json()
    assert body["total"] == 25
    assert body["by_severity"]["high"] == 5
    assert body["by_severity"]["low"] == 20
    assert body["by_status"]["new"] == 25


def test_over_time_counts_sum_to_total(client, analyst_headers, seeded):
    points = client.get("/alerts/over-time", headers=analyst_headers).json()
    assert sum(p["count"] for p in points) == 25