# Phase 5 local model fit and quantization selection tasks

This checklist tracks the bounded discovery-and-decision slice that chooses explicit Ollama quantization tags for safe local use on the M1 32 GB machine.

## Phase 5: Local model fit and quantization selection

- Target: replace implicit default Ollama pulls with explicit per-use-case model-tag recommendations for this machine.
- Phase gate: extraction behavior is stable enough that the benchmark verdict is about model fit and quantization, not unresolved pipeline defects.
- Phase output: one durable recommendation matrix note under `docs/0421/02/`, plus any tiny workflow-doc updates needed to point later runs at explicit tags.
- Phase 5 status: ready to start.
- Local checkpoint:
  treat this as a machine-specific decision slice for Apple Silicon M1 with 32 GB unified memory and about 8-10 GB reserved headroom.
- [ ] Freeze the evaluation rubric in the matrix note before benchmarking:
  safe means single-model runs stay within about 22-24 GB effective model budget,
  swap does not grow meaningfully during the measured run,
  and the machine does not show obvious memory-pressure distress.
- [ ] Keep the benchmark assumptions narrow:
  `OLLAMA_NUM_PARALLEL=1`,
  `OLLAMA_MAX_LOADED_MODELS=1`,
  and no multi-model residency during comparison runs.
- [ ] Inventory the explicit tags that actually exist for the in-scope candidates instead of assuming Ollama defaults:
  CodeLlama,
  DeepSeek Coder,
  Llama 3.x,
  and Mistral.
- [ ] Record which quantization ladder will be tested for each family:
  one low/default-like tag,
  one balanced middle tag,
  and one higher-quality tag if it plausibly fits.
- [ ] Keep Mixtral 8x7b out of the default test matrix unless there is a deliberate explicit edge-case run with written justification.
- [ ] Define one bounded benchmark input per use case:
  one coding task,
  one general-chat prompt,
  and one document-analysis run using the approved bounded fixture set.
- [ ] Use one consistent observation method for every run and record it in the matrix note:
  resident memory estimate,
  swap observation,
  run completion time,
  and a short quality verdict.
- [ ] Run the 7B to 8B candidates first and check whether higher-quality tags such as `Q6_K` or `Q8_0` fit comfortably enough to replace low-quant defaults.
- [ ] Run the 13B to 14B candidates second and keep only the best-balanced tag that stays below the safe budget with headroom.
- [ ] Treat 33B to 34B candidates as edge tests only:
  if they trigger swap growth, visible pressure, or clearly unsafe residency, reject them for sustained local ingestion and record that explicitly.
- [ ] Publish one recommendation matrix that names for each family:
  preferred default tag,
  highest safe tested tag,
  rejected tags,
  and one short reason for the decision.
- [ ] If this phase introduces new stable benchmark commands, update `devbox.json` and `README.md` together in the same change.
- [ ] Verification:
  rerun the selected winning tag once per use case and confirm the recommendation still holds under the same measurement method.
- [ ] Exit gate:
  coding, general chat, and document analysis each have an explicit recommended Ollama tag for this machine,
  the chosen tags stay within the intended headroom policy,
  and later local-ingestion work no longer depends on ambiguous default quantization behavior.

## Hold line

- [ ] Do not reopen prompt, extractor, chunking, or ingest logic from this task file.
- [ ] Do not convert this phase into a broad model bake-off across every Ollama family.
- [ ] Do not accept a "best" tag that only works by consuming the reserved headroom or causing swap growth.
- [ ] If the benchmark results are inconclusive, stop on the smallest additional comparison needed and write the uncertainty down instead of widening scope blindly.
