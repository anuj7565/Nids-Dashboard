import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url

from app.core.config import settings

# Point the app at the TEST database before anything creates an engine.
_url = make_url(settings.database_url)
_name = _url.database or ""
if not _name.endswith("_test"):
    _name += "_test"
settings.database_url = _url.set(database=_name).render_as_string(
    hide_password=False
)
settings.alert_source = "seed"

# Safety guard: never run against a database that isn't a test database.
assert make_url(settings.database_url).database.endswith("_test")

from app.core.limiter import limiter
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.main import app
from app.models import acknowledgement, alert, user  # noqa: F401
from app.models.user import User

PASSWORD = "Passw0rd!test"
ANALYST_EMAIL = "analyst@test.com"
ADMIN_EMAIL = "admin@test.com"


@pytest.fixture(scope="session", autouse=True)
def _create_tables():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    names = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.exec_driver_sql(f"TRUNCATE {names} RESTART IDENTITY CASCADE")
    yield


@pytest.fixture(autouse=True)
def _limiter_off():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _make_user(db, email, username, role):
    u = User(
        email=email,
        username=username,
        password_hash=hash_password(PASSWORD),
        role=role,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def analyst(db):
    return _make_user(db, ANALYST_EMAIL, "analyst1", "analyst")


@pytest.fixture
def admin(db):
    return _make_user(db, ADMIN_EMAIL, "admin1", "admin")


@pytest.fixture
def client():
    return TestClient(app)


def _headers(client, email):
    # Login is OAuth2 form-encoded; the "username" field carries the email.
    r = client.post("/auth/login", data={"username": email, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def analyst_headers(client, analyst):
    return _headers(client, ANALYST_EMAIL)


@pytest.fixture
def admin_headers(client, admin):
    return _headers(client, ADMIN_EMAIL)