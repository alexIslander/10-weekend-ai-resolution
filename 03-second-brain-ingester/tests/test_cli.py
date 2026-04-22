from __future__ import annotations

import json
from pathlib import Path

import pytest

from second_brain_ingester.cli import main
from second_brain_ingester.notes.components import api_client


def test_cli_help_exits_successfully(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as excinfo:
        main(["--help"])

    captured = capsys.readouterr()

    assert excinfo.value.code == 0
    assert "Ingest source material into second-brain artifacts." in captured.out


def test_cli_run_writes_output(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_run_with_linker_writes_output(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
            "--enable",
            "linker",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_run_with_srq_writes_output(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
            "--enable",
            "srq",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_run_with_anti_pattern_writes_output(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
            "--enable",
            "anti-pattern",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_run_with_adr_writes_output(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
            "--enable",
            "adr",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_run_with_moc_writes_output(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
            "--enable",
            "moc",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_can_emit_extracted_source_markdown(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf",
            "--output-dir",
            str(tmp_path),
            "--dry-run",
            "--enable",
            "extractor",
            "--emit-extracted-source-markdown",
        ]
    )

    captured = capsys.readouterr()
    run_directories = [path for path in tmp_path.iterdir() if path.is_dir()]

    assert result == 0
    assert len(run_directories) == 1
    artifact_path = run_directories[0] / "extracted-source.md"
    assert artifact_path.exists()
    artifact_text = artifact_path.read_text(encoding="utf-8")
    assert "Extracted source" in artifact_text
    assert "Chapter 1" in artifact_text
    assert "effective storytelling" in artifact_text
    assert "Wrote extracted source markdown to" in captured.out


def test_cli_run_with_ollama_provider_writes_output(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _mock_ollama_response(monkeypatch)

    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/sample.txt",
            "--output-dir",
            str(tmp_path),
            "--no-dry-run",
            "--provider",
            "ollama",
            "--model",
            "qwen3:8b",
            "--enable",
            "extractor",
        ]
    )

    captured = capsys.readouterr()

    assert result == 0
    assert "Wrote run artifacts to" in captured.out


def test_cli_run_with_ollama_on_narrative_pdf_fixture(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _mock_ollama_response(monkeypatch)

    result = main(
        [
            "run",
            "--input",
            "tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf",
            "--output-dir",
            str(tmp_path),
            "--no-dry-run",
            "--provider",
            "ollama",
            "--model",
            "qwen3:8b",
            "--enable",
            "extractor",
        ]
    )

    captured = capsys.readouterr()
    run_directories = [path for path in tmp_path.iterdir() if path.is_dir()]

    assert result == 0
    assert len(run_directories) == 1
    assert any(path.suffix == ".md" for path in run_directories[0].rglob("*.md"))
    assert "Wrote run artifacts to" in captured.out


def _mock_ollama_response(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeOpener:
        def open(self, request: object, timeout: int) -> "FakeResponse":
            assert isinstance(request, api_client.urllib_request.Request)
            assert timeout == 600
            payload = json.loads(request.data.decode("utf-8"))
            assert payload["model"] == "qwen3:8b"
            assert payload["format"] == "json"
            return FakeResponse()

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def read(self) -> bytes:
            return json.dumps(
                {
                    "response": json.dumps(
                        {
                            "notes": [
                                {
                                    "title": "Connection through storytelling",
                                    "summary": "Storytelling helps people connect ideas to felt experience.",
                                    "body": "## Summary\n\nStorytelling helps people connect ideas to felt experience.\n\n## Key details\n\n- Narrative framing improves recall.\n\n## Related links\n\n- [[Storytelling]]\n\n## Source excerpt\n\nEffective storytelling helps people remember and internalize ideas.",
                                    "tags": ["extracted", "pdf"],
                                    "links": ["Storytelling"],
                                    "source_excerpt": "Effective storytelling helps people remember and internalize ideas.",
                                }
                            ]
                        }
                    )
                }
            ).encode("utf-8")

    monkeypatch.setattr(api_client.urllib_request, "build_opener", lambda *_args: FakeOpener())
