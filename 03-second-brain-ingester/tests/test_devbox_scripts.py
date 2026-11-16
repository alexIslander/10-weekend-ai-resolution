from __future__ import annotations

import json
from pathlib import Path


def test_phase_4_5_qwen3_smoke_script_uses_distinct_output_path() -> None:
    devbox_config = json.loads(Path("devbox.json").read_text(encoding="utf-8"))
    scripts = devbox_config["shell"]["scripts"]
    command = scripts["03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3"]

    assert "--model qwen3:8b" in command
    assert (
        "--output-dir vault_output/"
        "devbox-03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3-run"
    ) in command
    assert "devbox-02-head-first-sa-chapter-short-txt-ollama-smoke-run" not in command


def test_phase_5_model_fit_test_script_is_bounded() -> None:
    devbox_config = json.loads(Path("devbox.json").read_text(encoding="utf-8"))
    scripts = devbox_config["shell"]["scripts"]
    command = scripts["phase-5-model-fit-test"]

    assert command == "uv run pytest tests/test_devbox_scripts.py"
