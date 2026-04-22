"""Deterministic structured extraction client for dry-run flows."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib import error as urllib_error
from urllib import request as urllib_request

from second_brain_ingester.common.models import (
    ExtractedNoteDraft,
    ExtractionRequest,
    ExtractionResponse,
)


class ExtractionResponseParseError(ValueError):
    """Raised when a raw extraction payload cannot be parsed into typed notes."""


class StructuredExtractionClientError(RuntimeError):
    """Raised when the extraction client cannot complete a request."""


def parse_extraction_response(chunk_id: str, raw_payload: str) -> ExtractionResponse:
    try:
        payload = json.loads(raw_payload)
    except json.JSONDecodeError as exc:
        raise ExtractionResponseParseError(f"Invalid extraction payload: {exc.msg}") from exc

    raw_notes = payload.get("notes")
    if not isinstance(raw_notes, list) or not raw_notes:
        raise ExtractionResponseParseError(
            "Extraction payload must include a non-empty notes list."
        )

    notes: list[ExtractedNoteDraft] = []
    for raw_note in raw_notes:
        if not isinstance(raw_note, dict):
            raise ExtractionResponseParseError("Each extracted note must be an object.")

        title = raw_note.get("title")
        summary = raw_note.get("summary")
        body = raw_note.get("body")
        if not isinstance(title, str) or not title.strip():
            raise ExtractionResponseParseError("Extracted note title must be a non-empty string.")
        if not isinstance(summary, str) or not summary.strip():
            raise ExtractionResponseParseError("Extracted note summary must be a non-empty string.")
        if not isinstance(body, str) or not body.strip():
            raise ExtractionResponseParseError("Extracted note body must be a non-empty string.")

        tags = _ensure_string_list(raw_note.get("tags"), field_name="tags")
        links = _ensure_string_list(raw_note.get("links"), field_name="links")
        source_excerpt = raw_note.get("source_excerpt")
        if source_excerpt is not None and not isinstance(source_excerpt, str):
            raise ExtractionResponseParseError("source_excerpt must be a string when provided.")

        notes.append(
            ExtractedNoteDraft(
                title=title.strip(),
                summary=summary.strip(),
                body=body.strip(),
                tags=tags,
                links=links,
                source_excerpt=source_excerpt.strip() if isinstance(source_excerpt, str) else None,
            )
        )

    return ExtractionResponse(chunk_id=chunk_id, raw_payload=raw_payload, notes=notes)


class DryRunStructuredExtractionClient:
    def __init__(self, prompt_path: Path | None = None) -> None:
        self._prompt_path = prompt_path

    def complete(self, request: ExtractionRequest) -> ExtractionResponse:
        raw_payload = json.dumps(self._build_payload(request), indent=2, sort_keys=True)
        return parse_extraction_response(chunk_id=request.chunk_id, raw_payload=raw_payload)

    def _build_payload(self, request: ExtractionRequest) -> dict[str, object]:
        first_sentence = _first_sentence(request.chunk_text)
        note_title = _build_title(request)
        related_link = f"{request.source_title} reference"
        prompt_name = self._prompt_path.name if self._prompt_path is not None else "inline"
        return {
            "chunk_id": request.chunk_id,
            "notes": [
                {
                    "title": note_title,
                    "summary": first_sentence,
                    "body": (
                        "## Summary\n\n"
                        f"{first_sentence}\n\n"
                        "## Key details\n\n"
                        f"- Source chunk: {request.chunk_title}\n"
                        f"- Prompt asset: {prompt_name}\n"
                        f"- Source type: {request.source_type}\n\n"
                        "## Related links\n\n"
                        f"- [[{related_link}]]\n\n"
                        "## Source excerpt\n\n"
                        f"{_truncate(request.chunk_text, limit=280)}"
                    ),
                    "tags": ["extracted", request.source_type, "dry-run"],
                    "links": [related_link],
                    "source_excerpt": _truncate(request.chunk_text, limit=180),
                }
            ],
        }


class OllamaStructuredExtractionClient:
    def __init__(
        self,
        model: str,
        base_url: str,
        prompt_path: Path | None = None,
        timeout_seconds: int = 600,
    ) -> None:
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._prompt_path = prompt_path
        self._timeout_seconds = timeout_seconds

    def complete(self, request: ExtractionRequest) -> ExtractionResponse:
        payload = {
            "model": self._model,
            "system": request.prompt,
            "prompt": _build_ollama_prompt(request, self._prompt_path),
            "stream": False,
            "format": "json",
            "options": {"temperature": 0},
        }
        request_bytes = json.dumps(payload).encode("utf-8")
        http_request = urllib_request.Request(
            url=f"{self._base_url}/api/generate",
            data=request_bytes,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        opener = urllib_request.build_opener(urllib_request.ProxyHandler({}))
        try:
            with opener.open(http_request, timeout=self._timeout_seconds) as response:
                raw_response = json.loads(response.read().decode("utf-8"))
        except urllib_error.URLError as exc:
            raise StructuredExtractionClientError(
                f"Ollama request failed for model {self._model}: {exc}"
            ) from exc

        response_text = raw_response.get("response")
        if not isinstance(response_text, str) or not response_text.strip():
            raise StructuredExtractionClientError(
                f"Ollama returned an empty response for chunk {request.chunk_id}."
            )

        return parse_extraction_response(
            chunk_id=request.chunk_id,
            raw_payload=_strip_json_fences(response_text),
        )


def _ensure_string_list(value: object, field_name: str) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ExtractionResponseParseError(f"{field_name} must be a list of strings.")
    return [item.strip() for item in value if item.strip()]


def _build_title(request: ExtractionRequest) -> str:
    seed = re.sub(r"[^a-z0-9 ]+", " ", request.chunk_text.lower())
    words = [word for word in seed.split() if len(word) > 3][:6]
    suffix = " ".join(word.capitalize() for word in words) or request.chunk_title
    return f"{request.source_title}: {suffix}"


def _first_sentence(text: str) -> str:
    normalized = " ".join(text.split())
    if not normalized:
        return "No summary available."
    match = re.search(r"(.+?[.!?])(?:\s|$)", normalized)
    sentence = match.group(1) if match else normalized
    return _truncate(sentence, limit=180)


def _truncate(text: str, limit: int) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def _build_ollama_prompt(request: ExtractionRequest, prompt_path: Path | None) -> str:
    prompt_name = prompt_path.name if prompt_path is not None else "inline"
    return (
        "Extract atomic notes from the following chunk.\n\n"
        f"Prompt asset: {prompt_name}\n"
        f"Source title: {request.source_title}\n"
        f"Source type: {request.source_type}\n"
        f"Chunk title: {request.chunk_title}\n"
        f"Chunk ID: {request.chunk_id}\n\n"
        "Chunk text:\n"
        f"{request.chunk_text}\n\n"
        "Return only valid JSON that matches the required notes schema."
    )


def _strip_json_fences(raw_payload: str) -> str:
    normalized = raw_payload.strip()
    if normalized.startswith("```"):
        normalized = re.sub(r"^```(?:json)?\s*", "", normalized)
        normalized = re.sub(r"\s*```$", "", normalized)
    return normalized.strip()
