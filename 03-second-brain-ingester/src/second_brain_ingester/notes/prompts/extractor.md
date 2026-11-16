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

- Return `notes: []` when the chunk is only connective tissue, navigation text, or too noisy to support a durable note.
- Otherwise return between 1 and 3 notes, only when each note captures a reusable idea worth keeping.
- Keep note titles specific, concept-led, and reusable outside the source document.
- Do not use generic titles such as `Chunk 2`, `Page 3`, `Introduction`, or titles that only describe a transition.
- Summaries must be 1 or 2 complete sentences and should abstract the idea rather than repeat a fragment from the chunk start.
- Write markdown body sections with these exact headings:
  `## Summary`
  `## Key details`
  `## Related links`
  `## Source excerpt`
- Preserve source evidence in `source_excerpt`.
- Keep `links` as note titles suitable for wiki-link rendering.
