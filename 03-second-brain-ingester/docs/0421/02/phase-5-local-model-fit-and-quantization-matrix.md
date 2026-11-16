# Phase 5 local model fit and quantization matrix

- Status: closed on 2026-04-24
- Branch: `feature/phase-5-local-model-fit`
- Machine: Apple Silicon M1, 32 GB unified memory
- Ollama client: `0.21.1`
- Runtime path: native `Ollama.app` on `http://127.0.0.1:11434`

## Safety rubric

Use single-model, single-request checks only:

- `OLLAMA_NUM_PARALLEL=1`
- `OLLAMA_MAX_LOADED_MODELS=1`
- unload one model before loading the next model
- target about 22-24 GB maximum model-side memory
- reject sustained defaults that create meaningful swap growth
- keep about 8-10 GB memory headroom for macOS and other services

The machine already had baseline swap usage before this phase. For this run, safety means
"does not grow swap during the measured loop," not "swap is zero."

## Local inventory

The local Ollama inventory after this phase:

| Tag | Parameters | Quantization | Disk size | Use in this phase |
| --- | ---: | --- | ---: | --- |
| `minicpm-v:latest` | 7.6B | Q4_0 | 5.47 GB | visual/table/image candidate |
| `llama3.2-vision:11b-instruct-q4_K_M` | 10.7B | Q4_K_M | 7.82 GB | visual/table/image quality candidate |
| `qwen3:8b` | 8.2B | Q4_K_M | 5.23 GB | stronger document candidate, rejected as default |
| `smollm2:1.7b` | 1.7B | Q8_0 | 1.82 GB | sustained document default |
| `mistral:latest` | 7.2B | Q4_0 | 4.11 GB | general-chat default |
| `codeqwen:latest` | 7.3B | Q4_0 | 4.18 GB | coding default |
| `llama3.2:latest` | 3.2B | Q4_K_M | 2.02 GB | fallback general-chat option |
| `gemma3:latest` | 4.3B | Q4_K_M | 3.34 GB | not tested in this slice |
| `llama3.3:70b` | 70.6B | Q4_K_M | 42.52 GB | rejected for this machine |

CodeLlama and DeepSeek Coder were not installed locally during this phase. They remain
deferred instead of being pulled into this review slice.

## Benchmark summary

| Use case | Candidate | Check | Time | Residency | Swap observation | Verdict |
| --- | --- | --- | ---: | --- | --- | --- |
| Visual PDF page description | `minicpm-v:latest` | Quick Look thumbnail from the short technical PDF fixture | 18.6s | 8.0 GB, 100% GPU, 32768 context | 8563.06M to 8563.06M equivalent; no growth | selected |
| Visual German table extraction | `minicpm-v:latest` | `tests/fixtures/images/test-de-table.png` with absolute image path | 32.11s | 8.0 GB, 100% GPU, 32768 context | 4288.38M to 4288.38M | safe, rough OCR |
| Visual cloud cheat-sheet description | `minicpm-v:latest` | `tests/fixtures/images/test-en-db-img.png` with absolute image path | 26.38s | 8.0 GB, 100% GPU, 32768 context | 4288.38M to 4288.38M | safe, rough summary |
| Visual German table extraction | `llama3.2-vision:11b-instruct-q4_K_M` | `tests/fixtures/images/test-de-table.png` with absolute image path | 81.55s | 15 GB, 100% GPU, 32768 context | 4288.38M to 4288.38M | selected for quality-critical tables |
| Visual cloud cheat-sheet description | `llama3.2-vision:11b-instruct-q4_K_M` | `tests/fixtures/images/test-en-db-img.png` with absolute image path | 94.62s | 15 GB, 100% GPU, 32768 context | 4288.38M to 4288.38M | safe but still imperfect |
| Document analysis | `qwen3:8b` | `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`, first run | 172.284s extraction | 10 GB, 100% GPU, 32768 context | 8563.06M to 9797.38M | pressure risk |
| Document analysis | `qwen3:8b` | `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`, repeat run | 164.067s extraction | 10 GB, 100% GPU, 32768 context | 4320.38M to 4320.38M | safe on repeat, not default |
| Document analysis | `smollm2:1.7b` | `devbox run 02-head-first-sa-chapter-short-txt-ollama-smoke` | 58.382s extraction | 4.0 GB, 100% GPU, 8192 context | 3791.38M to 3791.38M | selected |
| Coding | `codeqwen:latest` | bounded slugify function prompt | 4.68s | 8.3 GB, 100% GPU, 32768 context | 3791.38M to 3791.38M | selected with quality caveat |
| General chat | `mistral:latest` | three-bullet local model configurability prompt | 7.35s | 10 GB, 100% GPU, 32768 context | 3791.38M to 3791.38M | selected |

## Recommendation matrix

| Use case | Preferred default | Highest safe tested tag | Rejected or deferred tags | Reason |
| --- | --- | --- | --- | --- |
| Coding | `codeqwen:latest` | `codeqwen:latest` | `qwen3:8b` deferred for coding default after document swap growth; CodeLlama and DeepSeek Coder deferred because not installed | fits without swap growth and answers code prompts, but output formatting was imperfect and missed the `re` import |
| General chat | `mistral:latest` | `mistral:latest` | `llama3.3:70b` rejected; `qwen3:8b` not selected as default after swap growth in a real pipeline loop | good enough bounded response, 10 GB residency, no swap growth in the measured prompt |
| Text document analysis | `smollm2:1.7b` | `qwen3:8b` for manual quality-critical runs | `qwen3:8b` not selected as sustained default; `llama3.3:70b` rejected | smollm2 completes the bounded fixture much faster with no swap growth; qwen3 is stronger but uses 10 GB residency and showed one pressure-risk run before a safe repeat |
| Visual PDF image description | `minicpm-v:latest` | `llama3.2-vision:11b-instruct-q4_K_M` for manual quality-critical runs | 90B-class vision models rejected | MiniCPM-V is much faster and fits at 8.0 GB with no swap growth; Llama 3.2 Vision is slower at 15 GB but still safe in single-model runs |
| Visual PDF table/OCR extraction | `llama3.2-vision:11b-instruct-q4_K_M` for quality-critical pages; `minicpm-v:latest` for high-throughput rough sidecars | `llama3.2-vision:11b-instruct-q4_K_M` | 90B-class vision models rejected | Llama 3.2 Vision produced the better German table structure and values; MiniCPM-V was faster but had more OCR and column-placement errors |
| Edge large-model testing | none | none | `llama3.3:70b`; Mixtral 8x7b | installed 70B tag is 42.52 GB on disk and above the sustained local budget; Mixtral remains untested and deferred |

## Visual model policy

When a PDF page contains tables, diagrams, screenshots, or other image-only content, route
fast page-level visual sidecar work to `minicpm-v:latest` on this M1 machine. For pages where
table reconstruction or OCR fidelity matters more than throughput, route the page to
`llama3.2-vision:11b-instruct-q4_K_M` as a manual quality-critical visual model. Keep text
extraction and note generation separate from the visual sidecar until a later implementation
slice wires that behavior into the pipeline.

The current local Ollama `minicpm-v:latest` tag reports `Q4_0`, not `Q4_K_M`. Use the exact
tag and observed quantization from local inventory unless a later custom GGUF import proves a
different quantization.

For other environments, keep the model name configurable:

| Environment | Visual default | Status in this phase |
| --- | --- | --- |
| M1 32 GB | `minicpm-v:latest` for fast descriptions; `llama3.2-vision:11b-instruct-q4_K_M` for quality-critical tables/OCR | both tested locally |
| M4 Pro 48 GB | `llama3.2-vision:11b` or `minicpm-v:latest` sidecar | recommendation only; not tested here |
| CPU-only Linux | `minicpm-v` with a CPU-safe quantization | recommendation only; not tested here |

## Final defaults for later workflow docs

- Coding: `codeqwen:latest`
- General chat: `mistral:latest`
- Sustained text document analysis: `smollm2:1.7b`
- Quality-critical text document analysis: `qwen3:8b`, manual only with single-model residency and swap observation
- PDF image description: `minicpm-v:latest`
- PDF table/OCR quality pass: `llama3.2-vision:11b-instruct-q4_K_M`, manual only with single-model residency and swap observation
- Do not use `llama3.3:70b` or Mixtral 8x7b as sustained local defaults on this M1 machine.

## Verification commands

- `devbox run phase-4-extraction-test`
- `devbox run 02-head-first-sa-chapter-short-txt-ollama-smoke`
- `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`
- `devbox run phase-5-model-fit-test`

Manual runtime observations:

- `/Applications/Ollama.app/Contents/Resources/ollama ps`
- `sysctl vm.swapusage`
- `qlmanage -t -s 800 -o /tmp tests/fixtures/test-head-first-sa-ch2-short/Head-First-Software-Architecture-ch2-short.pdf`
- `/Applications/Ollama.app/Contents/Resources/ollama run minicpm-v "... /private/tmp/Head-First-Software-Architecture-ch2-short.pdf.png"`
- `/Applications/Ollama.app/Contents/Resources/ollama run minicpm-v "... /Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/tests/fixtures/images/test-de-table.png"`
- `/Applications/Ollama.app/Contents/Resources/ollama run llama3.2-vision:11b-instruct-q4_K_M "... /Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/tests/fixtures/images/test-de-table.png"`

## 2026-04-25 qwen3 repeat

The qwen3 document-analysis check was repeated after confirming no model was loaded.

- Baseline swap:
  `4320.38M` used of `5120.00M`.
- Command:
  `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`.
- Result:
  completed end to end.
- Extraction time:
  `164.067s`.
- Post-run residency:
  `qwen3:8b`, `10 GB`, `100% GPU`, `32768` context.
- Post-run swap:
  `4320.38M` used of `5120.00M`.

This repeat did not reproduce the first run's swap growth. The recommendation still keeps
`smollm2:1.7b` as the sustained document-analysis default because it is much faster, uses
less residency, and leaves more headroom. `qwen3:8b` is upgraded from "rejected as unsafe"
to "manual quality-critical option with explicit swap observation."

## 2026-04-25 visual fixture comparison

The visual-model comparison used the checked-in fixture directory
`tests/fixtures/images/`. Only absolute-path Ollama image attachments count as evidence;
earlier relative-path prompts did not print `Added image` and were discarded.

| Fixture | Model | Result |
| --- | --- | --- |
| `test-de-table.png` | `minicpm-v:latest` | completed in `32.11s`, stayed at `8.0 GB` GPU residency, and kept swap flat at `4288.38M`; reconstructed the table broadly but had OCR errors, header drift, and misplaced mass/description values |
| `test-en-db-img.png` | `minicpm-v:latest` | completed in `26.38s`, stayed at `8.0 GB` GPU residency, and kept swap flat; identified the title/structure broadly but mixed provider columns and hallucinated some services |
| `test-de-table.png` | `llama3.2-vision:11b-instruct-q4_K_M` | completed in `81.55s`, stayed at `15 GB` GPU residency, and kept swap flat; produced the best table structure and several correct German values, with remaining OCR typos and some missing mass values |
| `test-en-db-img.png` | `llama3.2-vision:11b-instruct-q4_K_M` | completed in `94.62s`, stayed at `15 GB` GPU residency, and kept swap flat; read the main title and several cloud services correctly, but still drifted into generic categories and duplicated/misplaced cloud-agnostic entries |

Decision: use `minicpm-v:latest` for high-throughput visual descriptions and rough sidecars.
Use `llama3.2-vision:11b-instruct-q4_K_M` for quality-critical table/OCR pages when the
pipeline can afford the longer per-page latency and single-model 15 GB residency.
