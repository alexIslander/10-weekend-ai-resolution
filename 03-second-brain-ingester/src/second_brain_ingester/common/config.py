"""Project configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

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
    provider: Literal["dry-run", "ollama"] = Field(default="dry-run")
    model: str = Field(default="qwen3:8b")
    ollama_base_url: str = Field(default="http://localhost:11434")
    ollama_timeout_seconds: int = Field(default=600, ge=1)
    max_chunk_chars: int = Field(default=900, ge=200)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
