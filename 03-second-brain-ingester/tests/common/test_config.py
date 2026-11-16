from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.config import Settings


def test_settings_default_output_dir() -> None:
    settings = Settings(_env_file=None)

    assert settings.output_dir == Path("./vault_output")
    assert settings.dry_run is True
    assert settings.provider == "dry-run"
    assert settings.model == "qwen3:8b"
    assert settings.ollama_base_url == "http://localhost:11434"
    assert settings.ollama_timeout_seconds == 600
