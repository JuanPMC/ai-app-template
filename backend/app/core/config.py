from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    github_token: str
    github_repo: str
    github_branch: str = "main"
    features_base_path: str = "initiatives/"

    model_config = SettingsConfigDict(env_prefix="APP_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
