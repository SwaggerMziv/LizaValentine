from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://valentine:valentine@db:5432/valentine"
    s3_endpoint_url: str = "https://s3.amazonaws.com"
    s3_bucket: str = "valentine-saturn"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_region: str = "eu-central-1"
    owner_phone: str = "+79001234567"
    cors_origins: list[str] = ["http://localhost:3000"]
    session_duration_hours: int = 4
    admin_password: str = "saturn-admin"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
