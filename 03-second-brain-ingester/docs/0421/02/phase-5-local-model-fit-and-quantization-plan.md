# Phase 5 local model fit and quantization selection plan

## First real value

Phase 5 replaces "default Ollama tag by accident" with one explicit local-model recommendation per use case on this M1 machine.

- Real input:
  one bounded coding check,
  one bounded general-chat check,
  and the approved document-analysis fixtures already used by the recovery plan
- Real output artifact:
  one durable model-and-quantization matrix note under `docs/0421/02/` with explicit recommended Ollama tags and rejected edge cases
- Verification:
  rerun the bounded comparison set with the chosen explicit tags and confirm the selected defaults stay inside the intended local-memory budget without swap growth
- Manual quality verdict:
  the chosen tags are visibly stronger than low-quant defaults where they fit safely, and they do not push the machine into obvious memory pressure or sustained swap usage

## Goal

Choose the highest-quality Ollama quantization that is still safe for sustained local use on Apple Silicon M1 with 32 GB unified memory, leaving about 8-10 GB headroom for macOS and other processes. This phase should replace implicit default pulls with explicit model-tag choices for coding, general chat, and document-analysis runs, while keeping Mixtral 8x7b out of scope unless it is later tested deliberately.

## KISS Approach

1. Freeze the hardware budget and the safety rubric for this machine:
   target about 22-24 GB maximum model-side memory use,
   no meaningful swap growth during the measured run,
   and no multi-model or parallel-request assumptions.
2. Inventory the exact candidate model tags and quantizations available through Ollama for the in-scope families instead of assuming the shipped default is correct.
3. Compare only a small candidate ladder per family:
   usually the default-like low quant,
   one balanced middle quant,
   and one higher-quality quant that might still fit.
4. Use the smallest stable benchmark set that still reflects the real workload:
   one coding prompt,
   one general-chat prompt,
   one bounded document-analysis run,
   and the approved narrative PDF only when a stronger final confirmation is needed.
5. Publish one machine-specific recommendation matrix that names:
   the preferred default tag,
   the highest safe tag,
   and the rejected or deferred tags for each family.
6. Only after the matrix is written should later workflow or routing changes depend on these model choices.

## Scope

- In scope:
  Ollama tag selection,
  quantization tradeoff comparison,
  local runtime-safety checks on macOS,
  bounded latency checks,
  and written recommendations for coding, general chat, and document-analysis model families
- In scope:
  explicit handling of Apple Silicon constraints such as unified memory sharing and Metal-backed local inference
- Out of scope:
  cloud fallback,
  CUDA-specific optimization work,
  prompt rewrites,
  extractor logic changes,
  chunking changes,
  routing changes,
  and Mixtral 8x7b adoption without explicit follow-up evidence
- Stay unchanged:
  the approved recovery fixtures,
  the existing offline-first architecture,
  and the current extraction pipeline behavior unless a tiny benchmark-command addition is required
- Constraint:
  keep evaluation single-model and single-request by default so the chosen recommendations reflect realistic safe local ingestion, not optimistic lab conditions

## Expected outcome

- The repo has a written, machine-specific quantization policy instead of relying on Ollama defaults.
- Each in-scope use case has one explicit recommended tag and one clearly documented ceiling for "higher quality but still safe" local use.
- Edge or oversized models are rejected with evidence instead of being left as speculative options.
- Later documentation and workflow defaults can point at explicit tags with less risk of swap-heavy or thermally unstable local runs.

## Execution inputs

- Recovery context:
  [secondbrain-recovery-execution-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/secondbrain-recovery-execution-plan.md)
  [phase-1-first-real-value-ollama-run.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-1-first-real-value-ollama-run.md)
  [phase-4-extraction-verification-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-4-extraction-verification-recovery.md)
- External optimization reference:
  [Ollama and Open WebUI Optimization Guide - Choosing Quantization](https://github.com/gl0bal01/devbox/blob/main/docs/ollama-optimization.md#choosing-quantization)
- Machine constraints:
  Apple Silicon M1,
  32 GB unified memory,
  local-only inference,
  macOS Metal backend,
  and about 8-10 GB reserved headroom outside the model budget
- In-scope model families:
  CodeLlama,
  DeepSeek Coder,
  Llama 3.x,
  Mistral,
  and Mixtral only as an explicitly deferred edge case unless later testing is approved

## Phase plan

### Phase 5: Local model fit and quantization selection

- Target:
  choose the best-fitting explicit Ollama tag per use case for this machine
- Phase gate:
  the extraction pipeline is stable enough that model comparisons reflect model choice more than pipeline defects
- Phase output:
  one local-model recommendation matrix note,
  one short benchmark summary,
  and one explicit default-tag recommendation list for later workflow docs or commands
- Exit gate:
  coding, general chat, and document-analysis each have a named recommended tag,
  each family also has a documented max-safe tested tag or an explicit defer decision,
  the chosen defaults stay inside the effective 22-24 GB machine budget under single-model runs,
  no selected tag shows meaningful swap growth in the measured loop,
  and Mixtral 8x7b is either explicitly deferred or supported by direct evidence rather than assumption
- Evidence loop:
  1. inventory available explicit quantization tags for the candidate models,
  2. run the bounded comparison ladder per family,
  3. capture memory-pressure and swap observations the same way for every run,
  4. record latency and output-quality notes,
  5. publish the per-family recommendation matrix
- Lean verification:
  one bounded run per selected candidate tag,
  one consistent system-observation checklist for memory pressure and swap,
  one final matrix note under `docs/0421/02/`

## Candidate ladder assumptions

- 7B to 8B class models should be tested above the default-low quant first:
  compare at least one low quant against `Q5_K_M`, `Q6_K`, or `Q8_0` when those tags exist.
- 13B to 14B class models should be treated as balance-first:
  start from middle quant choices and only keep higher quant tags if they stay clearly below the machine budget.
- 33B to 34B class models should be treated as edge candidates:
  test only if a bounded run can stay swap-safe with the required headroom; otherwise reject them for sustained local ingestion.
- Mixtral 8x7b should remain deferred by default because the expected footprint is already near or above the safe budget for this machine.

## Default operating assumptions for this phase

- `OLLAMA_NUM_PARALLEL=1`
- `OLLAMA_MAX_LOADED_MODELS=1`
- short or zero keep-alive unless the same model is being rerun immediately for comparison
- no CUDA-only assumptions and no planning around NVIDIA-only Flash Attention guidance
