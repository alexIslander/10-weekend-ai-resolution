from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.config import Settings


def test_settings_default_output_dir() -> None:
    settings = Settings()

    assert settings.output_dir == Path("./vault_output")
    assert settings.dry_run is True
