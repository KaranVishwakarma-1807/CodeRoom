from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CodeRoom Backend"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/coderoom"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120
    auth_bypass_enabled: bool = False
    auth_bypass_email: str = "dev@coderoom.local"
    auth_bypass_name: str = "Dev User"

    room_expiry_hours: int = 6
    judge0_api_url: str | None = None
    judge0_api_key: str | None = None
    metered_domain: str | None = None
    metered_secret_key: str | None = None
    metered_embed_sdk_url: str = "https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js"


settings = Settings()
