"""Typed LLM client boundary for structured extraction."""

from __future__ import annotations

from typing import Protocol

from second_brain_ingester.common.models import ExtractionRequest, ExtractionResponse


class StructuredExtractionClient(Protocol):
    def complete(self, request: ExtractionRequest) -> ExtractionResponse:
        ...
