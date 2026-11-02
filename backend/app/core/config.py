from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    alert_source: str = "seed"
    nids_api_url: str = "http://127.0.0.1:8000"
    seed_file: str = "../docs/sample_alerts.json"
    database_url: str
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    frontend_origin: str = "http://localhost:5173"


settings = Settings()