from __future__ import annotations

import json

import pytest

from second_brain_ingester.common.models import ExtractionRequest
from second_brain_ingester.notes.components import api_client
from second_brain_ingester.notes.components.api_client import (
    DryRunStructuredExtractionClient,
    ExtractionResponseParseError,
    OllamaStructuredExtractionClient,
    parse_extraction_response,
)


def test_dry_run_api_client_returns_typed_response() -> None:
    client = DryRunStructuredExtractionClient()

    response = client.complete(
        ExtractionRequest(
            source_id="source-001",
            source_type="text",
            source_title="Sample Source",
            chunk_id="chunk-001",
            chunk_title="Chunk 1",
            chunk_text="Queues can reduce temporal coupling between services.",
            prompt="extract notes",
        )
    )

    assert response.chunk_id == "chunk-001"
    assert response.notes[0].title.startswith("Sample Source:")
    assert "Related links" in response.notes[0].body


def test_parse_extraction_response_rejects_invalid_payload() -> None:
    with pytest.raises(ExtractionResponseParseError):
        parse_extraction_response(
            chunk_id="chunk-001",
            raw_payload='{"notes":[{"title":"Missing summary","body":"x"}]}',
        )


def test_ollama_api_client_posts_to_generate_endpoint(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    class FakeOpener:
        def open(self, request: object, timeout: int) -> FakeResponse:
            assert isinstance(request, api_client.urllib_request.Request)
            captured["url"] = request.full_url
            captured["timeout"] = timeout
            captured["payload"] = json.loads(request.data.decode("utf-8"))
            return FakeResponse()

    class FakeResponse:
        def __enter__(self) -> FakeResponse:
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
                                    "title": "Queue-based decoupling",
                                    "summary": (
                                        "Queues reduce temporal coupling between services."
                                    ),
                                    "body": (
                                        "## Summary\n\n"
                                        "Queues reduce temporal coupling.\n\n"
                                        "## Key details\n\n"
                                        "- Async boundaries help.\n\n"
                                        "## Related links\n\n"
                                        "- [[Message queue]]\n\n"
                                        "## Source excerpt\n\n"
                                        "Queues reduce temporal coupling between services."
                                    ),
                                    "tags": ["extracted", "text"],
                                    "links": ["Message queue"],
                                    "source_excerpt": (
                                        "Queues reduce temporal coupling between services."
                                    ),
                                }
                            ]
                        }
                    )
                }
            ).encode("utf-8")

    monkeypatch.setattr(api_client.urllib_request, "build_opener", lambda *_args: FakeOpener())

    client = OllamaStructuredExtractionClient(
        model="qwen3:8b",
        base_url="http://localhost:11434",
    )
    response = client.complete(
        ExtractionRequest(
            source_id="source-001",
            source_type="text",
            source_title="Sample Source",
            chunk_id="chunk-001",
            chunk_title="Chunk 1",
            chunk_text="Queues can reduce temporal coupling between services.",
            prompt="extract notes",
        )
    )

    assert captured["url"] == "http://localhost:11434/api/generate"
    assert captured["timeout"] == 600
    assert captured["payload"] == {
        "model": "qwen3:8b",
        "system": "extract notes",
        "prompt": (
            "Extract atomic notes from the following chunk.\n\n"
            "Prompt asset: inline\n"
            "Source title: Sample Source\n"
            "Source type: text\n"
            "Chunk title: Chunk 1\n"
            "Chunk ID: chunk-001\n\n"
            "Chunk text:\n"
            "Queues can reduce temporal coupling between services.\n\n"
            "Return only valid JSON that matches the required notes schema."
        ),
        "stream": False,
        "format": "json",
        "options": {"temperature": 0},
    }
    assert response.notes[0].title == "Queue-based decoupling"
