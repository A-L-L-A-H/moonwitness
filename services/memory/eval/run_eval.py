"""Reproducible stdlib retrieval & citation evaluation runner for MW-0026.

Evaluates SQLite FTS5 (unicode61), TF-IDF cosine vector retrieval, and
Reciprocal Rank Fusion (RRF) hybrid retrieval against a versioned synthetic
corpus while preserving archive_id and message_id on every hit.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
import json
import math
from pathlib import Path
import re
import sqlite3
import sys
from typing import Any

DEFAULT_CORPUS_PATH = Path(__file__).resolve().with_name("corpus.json")

STOPWORDS: frozenset[str] = frozenset(
    {
        "a",
        "about",
        "across",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "before",
        "between",
        "by",
        "can",
        "did",
        "do",
        "does",
        "during",
        "each",
        "exist",
        "for",
        "from",
        "how",
        "in",
        "into",
        "is",
        "it",
        "of",
        "on",
        "or",
        "should",
        "that",
        "the",
        "their",
        "then",
        "there",
        "these",
        "they",
        "this",
        "to",
        "versus",
        "vs",
        "was",
        "were",
        "what",
        "when",
        "where",
        "which",
        "who",
        "why",
        "will",
        "with",
    }
)

_TOKEN_RE = re.compile(r"[a-z0-9]+")


@dataclass(frozen=True)
class EvalConfig:
    """Versioned parameters controlling retrieval cutoffs and abstention gates."""

    top_k: int = 3
    rrf_k: int = 60
    candidate_pool: int = 12
    fts_min_coverage: float = 0.38
    fts_min_abs_bm25: float = 0.0
    vector_min_cosine: float = 0.14
    hybrid_min_rrf: float = 0.015
    hybrid_min_cosine: float = 0.12
    hybrid_min_fts_coverage: float = 0.38


def tokenize(text: str, *, drop_stopwords: bool = True) -> list[str]:
    """Tokenize text consistently with SQLite FTS5 unicode61 word boundaries."""
    tokens = _TOKEN_RE.findall(text.lower())
    if not drop_stopwords:
        return tokens
    return [tok for tok in tokens if tok not in STOPWORDS]


def load_corpus(corpus_path: Path | str = DEFAULT_CORPUS_PATH) -> dict[str, Any]:
    """Load and validate a versioned evaluation corpus JSON file."""
    path = Path(corpus_path)
    payload = json.loads(path.read_text(encoding="utf-8"))
    messages = payload.get("messages")
    queries = payload.get("queries")
    if not isinstance(messages, list) or not isinstance(queries, list):
        raise ValueError("Corpus must define 'messages' and 'queries' lists")

    seen_pairs: set[tuple[str, str]] = set()
    by_message_id: dict[str, str] = {}
    for msg in messages:
        for key in ("archive_id", "message_id", "conversation_id", "content", "created_at"):
            if not isinstance(msg.get(key), str) or not msg[key].strip():
                raise ValueError(f"Message missing non-empty string field '{key}'")
        title = msg.get("title") or msg.get("conversation_title")
        if not isinstance(title, str) or not title.strip():
            raise ValueError("Message missing non-empty 'title' or 'conversation_title'")
        pair = (msg["archive_id"], msg["message_id"])
        if pair in seen_pairs:
            raise ValueError(f"Duplicate message key {pair}")
        seen_pairs.add(pair)
        by_message_id[msg["message_id"]] = msg["archive_id"]

    for query in queries:
        for key in ("id", "category", "query"):
            if not isinstance(query.get(key), str) or not query[key].strip():
                raise ValueError(f"Query missing non-empty string field '{key}'")
        if not isinstance(query.get("expect_abstention"), bool):
            raise ValueError(f"Query {query['id']} missing boolean 'expect_abstention'")
        exp_msgs = query.get("expected_message_ids")
        exp_archs = query.get("expected_archive_ids")
        if not isinstance(exp_msgs, list) or not isinstance(exp_archs, list):
            raise ValueError(f"Query {query['id']} missing expected ID lists")
        if query["expect_abstention"] and (exp_msgs or exp_archs):
            raise ValueError(f"Abstention query {query['id']} must not declare gold IDs")
        for msg_id in exp_msgs:
            if msg_id not in by_message_id:
                raise ValueError(f"Query {query['id']} references unknown message_id {msg_id}")
            if by_message_id[msg_id] not in exp_archs:
                raise ValueError(
                    f"Query {query['id']} missing archive_id {by_message_id[msg_id]} for {msg_id}"
                )

    return payload


class CorpusRetriever:
    """In-memory SQLite FTS5 + TF-IDF + RRF hybrid retriever over corpus messages."""

    def __init__(self, corpus: dict[str, Any], config: EvalConfig | None = None) -> None:
        self.corpus = corpus
        self.config = config or EvalConfig()
        self._conn = sqlite3.connect(":memory:")
        self._conn.row_factory = sqlite3.Row
        self._docs: dict[tuple[str, str], dict[str, Any]] = {}
        self._doc_tokens: dict[tuple[str, str], set[str]] = {}
        self._doc_vectors: dict[tuple[str, str], dict[str, float]] = {}
        self._idf: dict[str, float] = {}
        self._oov_idf: float = 1.0
        self._build_index()

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> CorpusRetriever:
        return self

    def __exit__(self, *_args: Any) -> None:
        self.close()

    def _build_index(self) -> None:
        self._conn.executescript(
            """
            CREATE TABLE messages (
                archive_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                conversation_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (archive_id, message_id)
            );
            CREATE VIRTUAL TABLE messages_fts USING fts5(
                archive_id UNINDEXED,
                message_id UNINDEXED,
                title,
                content,
                tokenize='unicode61'
            );
            """
        )

        tokenized_docs: dict[tuple[str, str], list[str]] = {}
        doc_freq: dict[str, int] = {}

        for raw in self.corpus["messages"]:
            title = raw.get("title") or raw.get("conversation_title", "")
            record = {
                "archive_id": raw["archive_id"],
                "message_id": raw["message_id"],
                "conversation_id": raw["conversation_id"],
                "title": title,
                "content": raw["content"],
                "created_at": raw["created_at"],
            }
            key = (record["archive_id"], record["message_id"])
            self._docs[key] = record

            self._conn.execute(
                """
                INSERT INTO messages (archive_id, message_id, conversation_id, title, content, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    record["archive_id"],
                    record["message_id"],
                    record["conversation_id"],
                    record["title"],
                    record["content"],
                    record["created_at"],
                ),
            )
            self._conn.execute(
                """
                INSERT INTO messages_fts (archive_id, message_id, title, content)
                VALUES (?, ?, ?, ?)
                """,
                (
                    record["archive_id"],
                    record["message_id"],
                    record["title"],
                    record["content"],
                ),
            )

            tokens = tokenize(f"{record['title']} {record['content']}", drop_stopwords=True)
            tokenized_docs[key] = tokens
            unique_tokens = set(tokens)
            self._doc_tokens[key] = unique_tokens
            for tok in unique_tokens:
                doc_freq[tok] = doc_freq.get(tok, 0) + 1

        self._conn.commit()
        total_docs = len(tokenized_docs)
        self._oov_idf = math.log(total_docs + 1.0) + 1.0
        self._idf = {
            tok: math.log((total_docs + 1.0) / (df + 1.0)) + 1.0
            for tok, df in sorted(doc_freq.items())
        }

        for key, tokens in tokenized_docs.items():
            self._doc_vectors[key] = self._tfidf_vector(tokens)

    def _tfidf_vector(self, tokens: list[str], *, include_oov: bool = False) -> dict[str, float]:
        counts: dict[str, int] = {}
        for tok in tokens:
            if include_oov or tok in self._idf:
                counts[tok] = counts.get(tok, 0) + 1
        if not counts:
            return {}
        weighted = {
            tok: (1.0 + math.log(count)) * self._idf.get(tok, self._oov_idf)
            for tok, count in counts.items()
        }
        norm = math.sqrt(sum(val * val for val in weighted.values()))
        if norm == 0.0:
            return {}
        return {tok: val / norm for tok, val in weighted.items()}

    def _query_terms(self, query: str) -> list[str]:
        filtered = tokenize(query, drop_stopwords=True)
        if not filtered:
            filtered = tokenize(query, drop_stopwords=False)
        return filtered

    def _format_hit(
        self,
        key: tuple[str, str],
        *,
        rank: int,
        score: float,
        mode: str,
        extra: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        doc = self._docs[key]
        hit = {
            "archive_id": doc["archive_id"],
            "message_id": doc["message_id"],
            "citation": f"{doc['archive_id']}:{doc['message_id']}",
            "conversation_id": doc["conversation_id"],
            "title": doc["title"],
            "created_at": doc["created_at"],
            "rank": rank,
            "score": round(score, 6),
            "mode": mode,
        }
        if extra:
            hit.update(extra)
        return hit

    def _raw_fts_candidates(self, query: str, limit: int) -> tuple[list[dict[str, Any]], float]:
        terms = list(dict.fromkeys(self._query_terms(query)))
        if not terms:
            return [], 0.0
        fts_expr = " OR ".join(f'"{term}"' for term in terms)
        rows = self._conn.execute(
            """
            SELECT m.archive_id, m.message_id, bm25(messages_fts) AS raw_bm25
            FROM messages_fts
            JOIN messages m
              ON m.archive_id = messages_fts.archive_id
             AND m.message_id = messages_fts.message_id
            WHERE messages_fts MATCH ?
            ORDER BY raw_bm25 ASC, m.archive_id ASC, m.message_id ASC
            LIMIT ?
            """,
            (fts_expr, limit),
        ).fetchall()

        term_set = set(terms)
        candidates: list[dict[str, Any]] = []
        for row in rows:
            key = (str(row["archive_id"]), str(row["message_id"]))
            matched = len(term_set & self._doc_tokens[key])
            coverage = matched / len(term_set)
            candidates.append(
                {
                    "key": key,
                    "score": max(0.0, -float(row["raw_bm25"])),
                    "coverage": coverage,
                }
            )
        top_coverage = candidates[0]["coverage"] if candidates else 0.0
        return candidates, top_coverage

    def _raw_vector_candidates(self, query: str, limit: int) -> list[dict[str, Any]]:
        q_tokens = self._query_terms(query)
        q_vec = self._tfidf_vector(q_tokens, include_oov=True)
        if not q_vec:
            return []

        scored: list[tuple[float, tuple[str, str]]] = []
        for key, doc_vec in self._doc_vectors.items():
            sim = sum(q_val * doc_vec.get(tok, 0.0) for tok, q_val in q_vec.items())
            if sim > 0.0:
                scored.append((sim, key))

        scored.sort(key=lambda item: (-item[0], item[1][0], item[1][1]))
        return [{"key": key, "score": sim} for sim, key in scored[:limit]]

    def search_fts(self, query: str, top_k: int | None = None) -> dict[str, Any]:
        k = top_k or self.config.top_k
        candidates, top_coverage = self._raw_fts_candidates(query, max(k, self.config.candidate_pool))
        if (
            not candidates
            or top_coverage < self.config.fts_min_coverage
            or candidates[0]["score"] < self.config.fts_min_abs_bm25
        ):
            return {
                "mode": "fts",
                "abstained": True,
                "hits": [],
                "top_score": round(candidates[0]["score"], 6) if candidates else 0.0,
                "top_coverage": round(top_coverage, 6),
            }

        hits = [
            self._format_hit(
                cand["key"],
                rank=idx,
                score=cand["score"],
                mode="fts",
                extra={"token_coverage": round(cand["coverage"], 6)},
            )
            for idx, cand in enumerate(candidates[:k], start=1)
        ]
        return {
            "mode": "fts",
            "abstained": False,
            "hits": hits,
            "top_score": hits[0]["score"],
            "top_coverage": round(top_coverage, 6),
        }

    def search_vector(self, query: str, top_k: int | None = None) -> dict[str, Any]:
        k = top_k or self.config.top_k
        candidates = self._raw_vector_candidates(query, max(k, self.config.candidate_pool))
        if not candidates or candidates[0]["score"] < self.config.vector_min_cosine:
            return {
                "mode": "vector",
                "abstained": True,
                "hits": [],
                "top_score": round(candidates[0]["score"], 6) if candidates else 0.0,
            }

        hits = [
            self._format_hit(cand["key"], rank=idx, score=cand["score"], mode="vector")
            for idx, cand in enumerate(candidates[:k], start=1)
        ]
        return {
            "mode": "vector",
            "abstained": False,
            "hits": hits,
            "top_score": hits[0]["score"],
        }

    def search_hybrid(self, query: str, top_k: int | None = None) -> dict[str, Any]:
        k = top_k or self.config.top_k
        pool = max(k, self.config.candidate_pool)
        fts_candidates, top_fts_coverage = self._raw_fts_candidates(query, pool)
        vec_candidates = self._raw_vector_candidates(query, pool)

        rrf_scores: dict[tuple[str, str], float] = {}
        fts_ranks: dict[tuple[str, str], int] = {}
        vec_ranks: dict[tuple[str, str], int] = {}
        fts_cov_by_key: dict[tuple[str, str], float] = {}
        vec_score_by_key: dict[tuple[str, str], float] = {}

        for rank, cand in enumerate(fts_candidates, start=1):
            key = cand["key"]
            fts_ranks[key] = rank
            fts_cov_by_key[key] = cand["coverage"]
            rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (self.config.rrf_k + rank)

        for rank, cand in enumerate(vec_candidates, start=1):
            key = cand["key"]
            vec_ranks[key] = rank
            vec_score_by_key[key] = cand["score"]
            rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (self.config.rrf_k + rank)

        ranked = sorted(rrf_scores.items(), key=lambda item: (-item[1], item[0][0], item[0][1]))
        top_vec_score = vec_candidates[0]["score"] if vec_candidates else 0.0

        if not ranked:
            return {
                "mode": "hybrid",
                "abstained": True,
                "hits": [],
                "top_score": 0.0,
            }

        top_key, top_rrf = ranked[0]
        top_key_vec = vec_score_by_key.get(top_key, 0.0)
        top_key_cov = fts_cov_by_key.get(top_key, 0.0)
        grounded = (
            top_rrf >= self.config.hybrid_min_rrf
            and (
                top_key_vec >= self.config.hybrid_min_cosine
                or top_key_cov >= self.config.hybrid_min_fts_coverage
            )
            and (
                top_vec_score >= self.config.hybrid_min_cosine
                or top_fts_coverage >= self.config.hybrid_min_fts_coverage
            )
        )
        if not grounded:
            return {
                "mode": "hybrid",
                "abstained": True,
                "hits": [],
                "top_score": round(top_rrf, 6),
            }

        hits = [
            self._format_hit(
                key,
                rank=idx,
                score=rrf_score,
                mode="hybrid",
                extra={
                    "fts_rank": fts_ranks.get(key),
                    "vector_rank": vec_ranks.get(key),
                },
            )
            for idx, (key, rrf_score) in enumerate(ranked[:k], start=1)
        ]
        return {
            "mode": "hybrid",
            "abstained": False,
            "hits": hits,
            "top_score": hits[0]["score"],
        }


def _gold_pairs_for_query(
    query: dict[str, Any], message_archive_map: dict[str, str]
) -> set[tuple[str, str]]:
    if query["expect_abstention"]:
        return set()
    allowed_archives = set(query["expected_archive_ids"])
    pairs: set[tuple[str, str]] = set()
    for message_id in query["expected_message_ids"]:
        archive_id = message_archive_map[message_id]
        if archive_id in allowed_archives:
            pairs.add((archive_id, message_id))
    return pairs


def _evaluate_mode(
    retriever: CorpusRetriever,
    mode_name: str,
    queries: list[dict[str, Any]],
    message_archive_map: dict[str, str],
    top_k: int,
) -> dict[str, Any]:
    search_fn = {
        "fts": retriever.search_fts,
        "vector": retriever.search_vector,
        "hybrid": retriever.search_hybrid,
    }[mode_name]

    answerable_recalls: list[float] = []
    answerable_rrs: list[float] = []
    abstention_scores: list[float] = []
    citation_scores: list[float] = []
    failures: list[dict[str, Any]] = []
    per_query: list[dict[str, Any]] = []

    for query in queries:
        result = search_fn(query["query"], top_k=top_k)
        hits = result["hits"]
        abstained = bool(result["abstained"])
        gold_pairs = _gold_pairs_for_query(query, message_archive_map)
        gold_citations = sorted(f"{a}:{m}" for a, m in gold_pairs)
        retrieved_pairs = [(h["archive_id"], h["message_id"]) for h in hits]
        retrieved_citations = [h["citation"] for h in hits]

        if query["expect_abstention"]:
            abstention_ok = abstained and len(hits) == 0
            abst_score = 1.0 if abstention_ok else 0.0
            exactness = abst_score
            abstention_scores.append(abst_score)
            citation_scores.append(exactness)
            recall = None
            rr = None
            failure_reason = None if abstention_ok else "hallucinated_citation_on_unanswerable"
        else:
            matched_in_top_k = set(retrieved_pairs[:top_k]) & gold_pairs
            recall = len(matched_in_top_k) / len(gold_pairs) if gold_pairs else 0.0
            rr = 0.0
            for idx, pair in enumerate(retrieved_pairs[:top_k], start=1):
                if pair in gold_pairs:
                    rr = 1.0 / idx
                    break
            # R-precision over exact (archive_id, message_id) pairs up to len(gold_pairs).
            cutoff = len(gold_pairs)
            exactness = (
                len(set(retrieved_pairs[:cutoff]) & gold_pairs) / len(gold_pairs)
                if (not abstained and gold_pairs)
                else 0.0
            )
            answerable_recalls.append(recall)
            answerable_rrs.append(rr)
            citation_scores.append(exactness)

            if abstained:
                failure_reason = "false_abstention"
            elif recall < 1.0 or exactness < 1.0:
                failure_reason = "missing_or_misranked_gold_citation"
            else:
                failure_reason = None

        record = {
            "id": query["id"],
            "category": query["category"],
            "query": query["query"],
            "expect_abstention": query["expect_abstention"],
            "abstained": abstained,
            "expected_citations": gold_citations,
            "retrieved_citations": retrieved_citations,
            "hits": hits,
            "recall_at_3": round(recall, 4) if recall is not None else None,
            "reciprocal_rank": round(rr, 4) if rr is not None else None,
            "citation_exactness": round(exactness, 4),
            "failure_reason": failure_reason,
        }
        per_query.append(record)
        if failure_reason is not None:
            failures.append(
                {
                    "id": query["id"],
                    "category": query["category"],
                    "reason": failure_reason,
                    "expected_citations": gold_citations,
                    "retrieved_citations": retrieved_citations,
                    "abstained": abstained,
                }
            )

    def _mean(values: list[float]) -> float:
        return round(sum(values) / len(values), 4) if values else 0.0

    return {
        "recall_at_3": _mean(answerable_recalls),
        "mrr": _mean(answerable_rrs),
        "citation_exactness": _mean(citation_scores),
        "abstention_accuracy": _mean(abstention_scores),
        "failure_count": len(failures),
        "failures": failures,
        "per_query": per_query,
    }


def evaluate_corpus(
    corpus_path: Path | str = DEFAULT_CORPUS_PATH,
    config: EvalConfig | None = None,
) -> dict[str, Any]:
    """Run FTS5, TF-IDF vector, and RRF hybrid evaluation on a corpus JSON file."""
    cfg = config or EvalConfig()
    corpus = load_corpus(corpus_path)
    message_archive_map = {m["message_id"]: m["archive_id"] for m in corpus["messages"]}
    queries = corpus["queries"]
    answerable_count = sum(1 for q in queries if not q["expect_abstention"])
    abstention_count = sum(1 for q in queries if q["expect_abstention"])

    with CorpusRetriever(corpus, cfg) as retriever:
        modes = {
            mode: _evaluate_mode(retriever, mode, queries, message_archive_map, cfg.top_k)
            for mode in ("fts", "vector", "hybrid")
        }

    return {
        "corpus_version": corpus.get("version", "unknown"),
        "corpus_provenance": corpus.get("provenance", ""),
        "message_count": len(corpus["messages"]),
        "query_count": len(queries),
        "answerable_count": answerable_count,
        "abstention_count": abstention_count,
        "parameters": asdict(cfg),
        "measured_modes": modes,
        "unavailable_metrics": {
            "fastembed_lancedb_semantic": "Not measured in offline stdlib run (fastembed/lancedb dependencies and local model cache are unavailable here).",
            "llm_faithfulness_and_cost": "Not measured in offline retrieval baseline (no cloud Gemini API calls made).",
        },
    }


def format_markdown_summary(report: dict[str, Any]) -> str:
    """Format an evaluation report dictionary as a concise Markdown summary."""
    lines = [
        f"## Retrieval Evaluation Summary (Corpus v{report['corpus_version']})",
        "",
        f"- Messages: `{report['message_count']}` | Queries: `{report['query_count']}` "
        f"(`{report['answerable_count']}` answerable, `{report['abstention_count']}` abstention)",
        "",
        "| Mode | Recall@3 | MRR | Citation Exactness | Abstention Accuracy | Failures |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for mode in ("fts", "vector", "hybrid"):
        m = report["measured_modes"][mode]
        lines.append(
            f"| `{mode}` | {m['recall_at_3']:.4f} | {m['mrr']:.4f} | "
            f"{m['citation_exactness']:.4f} | {m['abstention_accuracy']:.4f} | {m['failure_count']} |"
        )

    lines.extend(["", "### Failure Cases", ""])
    any_failure = False
    for mode in ("fts", "vector", "hybrid"):
        failures = report["measured_modes"][mode]["failures"]
        for fail in failures:
            any_failure = True
            lines.append(
                f"- `{mode}` / `{fail['id']}` ({fail['category']}): {fail['reason']} "
                f"(expected={fail['expected_citations']}, got={fail['retrieved_citations']}, "
                f"abstained={fail['abstained']})"
            )
    if not any_failure:
        lines.append("- None across `fts`, `vector`, and `hybrid`.")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run MoonWitness Memory evaluation corpus.")
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS_PATH)
    parser.add_argument("--json-only", action="store_true")
    parser.add_argument("--md-only", action="store_true")
    args = parser.parse_args(argv)

    report = evaluate_corpus(args.corpus)
    if args.json_only:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    elif args.md_only:
        print(format_markdown_summary(report))
    else:
        print(json.dumps(report, indent=2, ensure_ascii=False))
        print()
        print(format_markdown_summary(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
