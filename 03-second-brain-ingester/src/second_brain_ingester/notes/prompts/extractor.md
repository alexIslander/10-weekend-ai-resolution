You are extracting atomic notes from one chunk of source material.

Return valid JSON with this shape:

```json
{
  "notes": [
    {
      "title": "string",
      "summary": "string",
      "body": "markdown string",
      "tags": ["string"],
      "links": ["string"],
      "source_excerpt": "string"
    }
  ]
}
```

Rules:

- Produce at least one note for every chunk.
- Keep note titles specific and reusable outside the source document.
- Write markdown body sections for summary, key details, related links, and source excerpt.
- Preserve source evidence in `source_excerpt`.
- Keep `links` as note titles suitable for wiki-link rendering.
