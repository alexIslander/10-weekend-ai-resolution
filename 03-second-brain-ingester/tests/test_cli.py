from __future__ import annotations

from pathlib import Path

import pytest

from second_brain_ingester.cli import main


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
