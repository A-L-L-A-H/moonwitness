# MoonWitness Memory Retrieval & Citation Evaluation Baseline (MW-0026)

## Dataset Provenance

- **Corpus file:** `apps/memory/eval/corpus.json` (`version: "1.0.0"`)
- **Provenance:** 100% synthetic, privacy-safe evaluation fixture authored specifically for MW-0026. Contains **zero** private user archives, ChatGPT exports, or personal transcripts.
- **Scale & coverage:** `18` synthetic archive messages across `3` synthetic archives (`arch-synth-01`, `arch-synth-02`, `arch-synth-03`) and `14` evaluation queries (`11` answerable, `3` abstention/unanswerable) spanning:
  - `factual` (`q-fact-01` .. `q-fact-04`)
  - `temporal` (`q-temp-01` .. `q-temp-03`, including v1-superseded-by-v2 transitions)
  - `ambiguous` (`q-ambig-01`, `q-ambig-02`, distinguishing UI `"Vault"` from keystore `"Vault"`)
  - `contradictory` (`q-contra-01`, `q-contra-02`, requiring both competing source passages)
  - `unanswerable` / `abstention` (`q-abst-01` .. `q-abst-03`, expecting abstention with zero citations)
- **Distractors:** `3` explicit non-factual entries (`msg-016` `[DREAM LOG]`, `msg-017` `[FICTION DRAFT]`, `msg-018` `[FICTIONAL SCENARIO]`) are indexed alongside technical entries.

## Versioned Parameters & Reproducibility

Executed via pure Python standard library (`sqlite3` FTS5 + `math` TF-IDF + RRF):

```bash
python apps/memory/eval/run_eval.py
```

| Parameter                 | Value                                          | Purpose                                             |
| ------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `top_k`                   | `3`                                            | Maximum citations returned per query                |
| `rrf_k`                   | `60`                                           | Reciprocal Rank Fusion smoothing constant           |
| `candidate_pool`          | `12`                                           | Per-retriever candidate depth before RRF fusion     |
| `fts_min_coverage`        | `0.38`                                         | Minimum query content-term coverage for FTS5 answer |
| `fts_min_abs_bm25`        | `0.0`                                          | Minimum positive `-bm25` floor for FTS5 answer      |
| `vector_min_cosine`       | `0.14`                                         | Minimum L2-normalized TF-IDF cosine for answer      |
| `hybrid_min_rrf`          | `0.015`                                        | Minimum fused RRF score for hybrid answer           |
| `hybrid_min_cosine`       | `0.12`                                         | Minimum vector support in hybrid grounding gate     |
| `hybrid_min_fts_coverage` | `0.38`                                         | Minimum FTS coverage in hybrid grounding gate       |
| `fts_tokenizer`           | `unicode61`                                    | SQLite FTS5 tokenizer matching `app/db.py`          |
| `tie_breaking`            | `(score DESC, archive_id ASC, message_id ASC)` | Deterministic ordering across runs                  |

Metric definitions:

- **`Recall@3`** (answerable queries): `|retrieved[:3] ∩ gold| / |gold|`.
- **`MRR`** (answerable queries): mean of `1 / rank` of the first gold `(archive_id, message_id)` hit within `top_k`.
- **`Citation Exactness`** (all `14` queries): R-precision on exact `(archive_id, message_id)` pairs up to `|gold|` for answerable queries (`1.0` if all gold pairs occupy top-`|gold|` slots), and `1.0` for abstention queries only when `abstained=True` and `hits=[]`.
- **`Abstention Accuracy`** (unanswerable/abstention queries): fraction returning `abstained=True` with `0` cited hits.

## Measured Metrics (Offline Stdlib Run)

All values below were directly measured from `python apps/memory/eval/run_eval.py` against `corpus.json` v1.0.0:

| Mode                     | Recall@3 |      MRR | Citation Exactness | Abstention Accuracy | Failures |
| ------------------------ | -------: | -------: | -----------------: | ------------------: | -------: |
| `fts` (SQLite FTS5 BM25) | `1.0000` | `0.9545` |           `0.9286` |            `1.0000` |      `1` |
| `vector` (Stdlib TF-IDF) | `1.0000` | `0.9545` |           `0.9286` |            `1.0000` |      `1` |
| `hybrid` (RRF `k=60`)    | `1.0000` | `0.9545` |           `0.9286` |            `1.0000` |      `1` |

### Manually Adjudicated Failure Examples

- **`q-temp-03` (`temporal`) across `fts`, `vector`, and `hybrid` (`missing_or_misranked_gold_citation`):**
  - **Query:** `"Is the static shared X-Bridge-Secret header still the active authentication design?"`
  - **Gold expected:** `['arch-synth-02:msg-006']` (v2 OIDC replacement note, `2026-10-18T14:30:00Z`).
  - **Retrieved top-3:** `['arch-synth-01:msg-005', 'arch-synth-02:msg-006', 'arch-synth-02:msg-011']`.
  - **Adjudication:** `arch-synth-02:msg-006` was recovered at rank `2` (`Recall@3 = 1.0`, `RR = 0.5`), but the superseded legacy v1 specification (`arch-synth-01:msg-005`, `2026-09-10T09:00:00Z`) ranked `1` because stateless BM25/TF-IDF rewards high token overlap in a shorter legacy message and has no representation of `valid_until` or `supersedes` links. This motivates claim-level temporal provenance in MW-0027.

## Unavailable & Estimated Metrics (Explicit Separation)

### Unavailable Metrics in Offline Stdlib Run

- **FastEmbed + LanceDB dense multilingual semantic retrieval (`apps/memory/backend/app/embeddings.py`):** Not measured. `fastembed` (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), `lancedb`, and local ONNX model weights are absent in the offline stdlib test environment. Dense vector `Recall@3`, `MRR`, `Citation Exactness`, and embedding latency must be measured separately inside the full backend container image (`apps/memory/backend/requirements.txt`).
- **Cloud Gemini extraction quality, answer faithfulness, throughput, and API cost:** Not measured. No external LLM/API calls are invoked by `run_eval.py`.

### Estimated Metrics

- **None.** No estimated or extrapolated numbers are reported in this baseline.
