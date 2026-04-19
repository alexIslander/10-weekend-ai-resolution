"""Project configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SECOND_BRAIN_",
        env_file=".env",
        extra="ignore",
    )

    output_dir: Path = Field(default=Path("./vault_output"))
    dry_run: bool = Field(default=True)
    max_chunk_chars: int = Field(default=900, ge=200)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
