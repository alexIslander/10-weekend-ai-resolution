from __future__ import annotations

import pytest

from second_brain_ingester.common.models import ExtractionRequest
from second_brain_ingester.notes.components.api_client import (
    DryRunStructuredExtractionClient,
    ExtractionResponseParseError,
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
