"""Claim-level Witness Ledger with temporal provenance (MW-0027).

Pure Python standard-library prototype backed by SQLite. Preserves source
archives and original messages untouched while modeling epistemic categories,
source excerpts/offsets/hashes, immutable revision history, and explicit
inter-claim relations (including contradictions and derivations).
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import sqlite3
from typing import Any
from uuid import uuid4

EPISTEMIC_TYPES: tuple[str, ...] = (
    "fact",
    "testimony",
    "hypothesis",
    "interpretation",
    "dream",
    "fiction",
    "unknown",
)

RELATION_TYPES: tuple[str, ...] = (
    "supports",
    "contradicts",
    "derived_from",
    "supersedes",
)

CLAIM_STATUSES: tuple[str, ...] = (
    "active",
    "superseded",
    "disputed",
    "unverified",
)

_SCHEMA_STATEMENTS: tuple[str, ...] = (
    """
    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        statement TEXT NOT NULL,
        epistemic_type TEXT NOT NULL CHECK (
            epistemic_type IN (
                'fact', 'testimony', 'hypothesis', 'interpretation',
                'dream', 'fiction', 'unknown'
            )
        ),
        status TEXT NOT NULL CHECK (
            status IN ('active', 'superseded', 'disputed', 'unverified')
        ),
        valid_from TEXT,
        valid_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS claim_sources (
        id TEXT PRIMARY KEY,
        claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        archive_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        offset_start INTEGER,
        offset_end INTEGER,
        source_sha256 TEXT NOT NULL,
        attribution TEXT NOT NULL DEFAULT '',
        rationale TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_claim_sources_claim
        ON claim_sources(claim_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_claim_sources_archive_msg
        ON claim_sources(archive_id, message_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS claim_revisions (
        id TEXT PRIMARY KEY,
        claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        revision_no INTEGER NOT NULL,
        previous_statement TEXT NOT NULL,
        new_statement TEXT NOT NULL,
        previous_epistemic_type TEXT NOT NULL,
        new_epistemic_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        revised_at TEXT NOT NULL,
        UNIQUE(claim_id, revision_no)
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_claim_revisions_claim
        ON claim_revisions(claim_id, revision_no)
    """,
    """
    CREATE TABLE IF NOT EXISTS claim_relations (
        id TEXT PRIMARY KEY,
        source_claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        target_claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        relation_type TEXT NOT NULL CHECK (
            relation_type IN ('supports', 'contradicts', 'derived_from', 'supersedes')
        ),
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_claim_relations_source
        ON claim_relations(source_claim_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_claim_relations_target
        ON claim_relations(target_claim_id)
    """,
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _query_all(
    db: sqlite3.Connection, sql: str, params: tuple[Any, ...] = ()
) -> list[dict[str, Any]]:
    cur = db.execute(sql, params)
    cols = [col[0] for col in (cur.description or ())]
    return [dict(zip(cols, tuple(row))) for row in cur.fetchall()]


def _query_one(
    db: sqlite3.Connection, sql: str, params: tuple[Any, ...] = ()
) -> dict[str, Any] | None:
    rows = _query_all(db, sql, params)
    return rows[0] if rows else None


def _table_exists(db: sqlite3.Connection, name: str) -> bool:
    row = db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()
    return row is not None


def _resolve_original_message(
    db: sqlite3.Connection, archive_id: str, message_id: str
) -> dict[str, Any] | None:
    if not _table_exists(db, "messages"):
        return None
    return _query_one(
        db,
        """
        SELECT message_id, archive_id, conversation_id, conversation_title, role, content, created_at
        FROM messages
        WHERE archive_id=? AND message_id=?
        """,
        (archive_id, message_id),
    )


def _validate_epistemic_type(epistemic_type: str) -> str:
    if epistemic_type not in EPISTEMIC_TYPES:
        raise ValueError(
            f"Invalid epistemic_type {epistemic_type!r}; expected one of {EPISTEMIC_TYPES}"
        )
    return epistemic_type


def _validate_status(status: str) -> str:
    if status not in CLAIM_STATUSES:
        raise ValueError(f"Invalid claim status {status!r}; expected one of {CLAIM_STATUSES}")
    return status


def _validate_relation_type(relation_type: str) -> str:
    if relation_type not in RELATION_TYPES:
        raise ValueError(
            f"Invalid relation_type {relation_type!r}; expected one of {RELATION_TYPES}"
        )
    return relation_type


def _normalize_offset(value: Any, name: str) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{name} must be a non-negative integer or None")
    return value


def _insert_claim_source(
    db: sqlite3.Connection,
    claim_id: str,
    source: dict[str, Any],
    created_at: str,
) -> dict[str, Any]:
    if not isinstance(source, dict):
        raise ValueError("source must be a dictionary")

    archive_id = str(source.get("archive_id", "")).strip()
    message_id = str(source.get("message_id", "")).strip()
    excerpt = source.get("excerpt")
    if not archive_id:
        raise ValueError("source.archive_id is required")
    if not message_id:
        raise ValueError("source.message_id is required")
    if not isinstance(excerpt, str) or not excerpt.strip():
        raise ValueError("source.excerpt must be a non-empty string")

    offset_start = _normalize_offset(source.get("offset_start"), "offset_start")
    offset_end = _normalize_offset(source.get("offset_end"), "offset_end")
    if offset_start is not None and offset_end is not None and offset_end < offset_start:
        raise ValueError("offset_end must be greater than or equal to offset_start")

    original = _resolve_original_message(db, archive_id, message_id)
    if offset_start is None and offset_end is None and original is not None:
        found_at = str(original.get("content", "")).find(excerpt)
        if found_at >= 0:
            offset_start = found_at
            offset_end = found_at + len(excerpt)

    explicit_hash = source.get("source_sha256")
    if isinstance(explicit_hash, str) and explicit_hash.strip():
        source_sha256 = explicit_hash.strip()
    elif isinstance(source.get("source_text"), str) and source["source_text"]:
        source_sha256 = hashlib.sha256(source["source_text"].encode("utf-8")).hexdigest()
    elif original is not None and isinstance(original.get("content"), str):
        source_sha256 = hashlib.sha256(original["content"].encode("utf-8")).hexdigest()
    else:
        source_sha256 = hashlib.sha256(excerpt.encode("utf-8")).hexdigest()

    attribution = str(source.get("attribution") or "").strip()
    rationale = str(source.get("rationale") or "").strip()
    source_id = str(uuid4())

    db.execute(
        """
        INSERT INTO claim_sources (
            id, claim_id, archive_id, message_id, excerpt,
            offset_start, offset_end, source_sha256, attribution, rationale, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            source_id,
            claim_id,
            archive_id,
            message_id,
            excerpt,
            offset_start,
            offset_end,
            source_sha256,
            attribution,
            rationale,
            created_at,
        ),
    )

    return {
        "id": source_id,
        "claim_id": claim_id,
        "archive_id": archive_id,
        "message_id": message_id,
        "excerpt": excerpt,
        "offset_start": offset_start,
        "offset_end": offset_end,
        "source_sha256": source_sha256,
        "attribution": attribution,
        "rationale": rationale,
        "created_at": created_at,
    }


def init_witness_ledger(db: sqlite3.Connection) -> None:
    """Create the Witness Ledger relational tables and indexes if absent."""
    for statement in _SCHEMA_STATEMENTS:
        db.execute(statement)


def create_claim(
    db: sqlite3.Connection,
    *,
    statement: str,
    epistemic_type: str,
    source: dict[str, Any] | None = None,
    valid_from: str | None = None,
    valid_until: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    """Create a claim while enforcing epistemic typing and source grounding."""
    clean_statement = statement.strip() if isinstance(statement, str) else ""
    if not clean_statement:
        raise ValueError("statement must be a non-empty string")
    validated_type = _validate_epistemic_type(epistemic_type)

    if status is not None:
        resolved_status = _validate_status(status)
        if source is None and resolved_status == "active":
            raise ValueError("Unsupported claim without a source cannot be marked 'active'")
    elif source is None or validated_type == "unknown":
        resolved_status = "unverified"
    else:
        resolved_status = "active"

    claim_id = str(uuid4())
    now = _utc_now()
    db.execute(
        """
        INSERT INTO claims (
            id, statement, epistemic_type, status, valid_from, valid_until, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            claim_id,
            clean_statement,
            validated_type,
            resolved_status,
            valid_from,
            valid_until,
            now,
            now,
        ),
    )

    sources: list[dict[str, Any]] = []
    if source is not None:
        sources.append(_insert_claim_source(db, claim_id, source, now))

    return {
        "id": claim_id,
        "statement": clean_statement,
        "epistemic_type": validated_type,
        "status": resolved_status,
        "valid_from": valid_from,
        "valid_until": valid_until,
        "created_at": now,
        "updated_at": now,
        "sources": sources,
    }


def add_claim_source(
    db: sqlite3.Connection, claim_id: str, source: dict[str, Any]
) -> dict[str, Any]:
    """Attach an additional immutable source excerpt record to an existing claim."""
    existing = _query_one(db, "SELECT id FROM claims WHERE id=?", (claim_id,))
    if not existing:
        raise ValueError(f"Claim '{claim_id}' not found")
    return _insert_claim_source(db, claim_id, source, _utc_now())


def revise_claim(
    db: sqlite3.Connection,
    claim_id: str,
    *,
    new_statement: str,
    new_epistemic_type: str | None = None,
    reason: str,
    new_status: str | None = None,
) -> dict[str, Any]:
    """Record an immutable claim revision without altering historical evidence."""
    existing = _query_one(db, "SELECT * FROM claims WHERE id=?", (claim_id,))
    if not existing:
        raise ValueError(f"Claim '{claim_id}' not found")

    clean_statement = new_statement.strip() if isinstance(new_statement, str) else ""
    if not clean_statement:
        raise ValueError("new_statement must be a non-empty string")
    clean_reason = reason.strip() if isinstance(reason, str) else ""
    if not clean_reason:
        raise ValueError("reason must be a non-empty string")

    resolved_type = (
        _validate_epistemic_type(new_epistemic_type)
        if new_epistemic_type is not None
        else str(existing["epistemic_type"])
    )

    if new_status is not None:
        resolved_status = _validate_status(new_status)
        if resolved_status == "active":
            src_count = db.execute(
                "SELECT COUNT(*) FROM claim_sources WHERE claim_id=?", (claim_id,)
            ).fetchone()[0]
            if src_count == 0:
                raise ValueError("Cannot mark an unsourced claim as 'active'")
    elif resolved_type == "unknown":
        resolved_status = "unverified"
    else:
        resolved_status = str(existing["status"])

    max_row = db.execute(
        "SELECT COALESCE(MAX(revision_no), 0) FROM claim_revisions WHERE claim_id=?",
        (claim_id,),
    ).fetchone()
    revision_no = int(max_row[0]) + 1
    revision_id = str(uuid4())
    now = _utc_now()

    db.execute(
        """
        INSERT INTO claim_revisions (
            id, claim_id, revision_no, previous_statement, new_statement,
            previous_epistemic_type, new_epistemic_type, reason, revised_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            revision_id,
            claim_id,
            revision_no,
            existing["statement"],
            clean_statement,
            existing["epistemic_type"],
            resolved_type,
            clean_reason,
            now,
        ),
    )
    db.execute(
        """
        UPDATE claims
        SET statement=?, epistemic_type=?, status=?, updated_at=?
        WHERE id=?
        """,
        (clean_statement, resolved_type, resolved_status, now, claim_id),
    )

    updated = _query_one(db, "SELECT * FROM claims WHERE id=?", (claim_id,))
    assert updated is not None
    updated["revision"] = {
        "id": revision_id,
        "claim_id": claim_id,
        "revision_no": revision_no,
        "previous_statement": existing["statement"],
        "new_statement": clean_statement,
        "previous_epistemic_type": existing["epistemic_type"],
        "new_epistemic_type": resolved_type,
        "reason": clean_reason,
        "revised_at": now,
    }
    return updated


def link_claims(
    db: sqlite3.Connection,
    source_claim_id: str,
    target_claim_id: str,
    relation_type: str,
    note: str = "",
) -> dict[str, Any]:
    """Create a typed relation between two claims while keeping both visible."""
    validated_rel = _validate_relation_type(relation_type)
    if source_claim_id == target_claim_id:
        raise ValueError("Cannot link a claim to itself")

    src_claim = _query_one(db, "SELECT * FROM claims WHERE id=?", (source_claim_id,))
    if not src_claim:
        raise ValueError(f"Source claim '{source_claim_id}' not found")
    tgt_claim = _query_one(db, "SELECT * FROM claims WHERE id=?", (target_claim_id,))
    if not tgt_claim:
        raise ValueError(f"Target claim '{target_claim_id}' not found")

    relation_id = str(uuid4())
    now = _utc_now()
    clean_note = note.strip() if isinstance(note, str) else ""

    db.execute(
        """
        INSERT INTO claim_relations (
            id, source_claim_id, target_claim_id, relation_type, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (relation_id, source_claim_id, target_claim_id, validated_rel, clean_note, now),
    )

    if validated_rel == "contradicts":
        for claim in (src_claim, tgt_claim):
            if claim["status"] == "active":
                db.execute(
                    "UPDATE claims SET status='disputed', updated_at=? WHERE id=?",
                    (now, claim["id"]),
                )
    elif validated_rel == "supersedes" and tgt_claim["status"] in ("active", "disputed"):
        new_valid_until = tgt_claim["valid_until"] or now
        db.execute(
            "UPDATE claims SET status='superseded', valid_until=?, updated_at=? WHERE id=?",
            (new_valid_until, now, tgt_claim["id"]),
        )

    return {
        "id": relation_id,
        "source_claim_id": source_claim_id,
        "target_claim_id": target_claim_id,
        "relation_type": validated_rel,
        "note": clean_note,
        "created_at": now,
    }


def trace_claim_provenance(db: sqlite3.Connection, claim_id: str) -> dict[str, Any] | None:
    """Resolve a claim to its revisions, relations, exact source excerpts, and messages."""
    claim = _query_one(db, "SELECT * FROM claims WHERE id=?", (claim_id,))
    if not claim:
        return None

    sources = _query_all(
        db,
        "SELECT * FROM claim_sources WHERE claim_id=? ORDER BY created_at ASC, id ASC",
        (claim_id,),
    )
    enriched_sources: list[dict[str, Any]] = []
    resolved_messages: list[dict[str, Any]] = []
    seen_msg_keys: set[tuple[str, str]] = set()
    for src in sources:
        original = _resolve_original_message(db, src["archive_id"], src["message_id"])
        enriched = dict(src)
        enriched["original_message"] = original
        enriched_sources.append(enriched)
        if original is not None:
            msg_key = (original["archive_id"], original["message_id"])
            if msg_key not in seen_msg_keys:
                seen_msg_keys.add(msg_key)
                resolved_messages.append(original)

    revisions = _query_all(
        db,
        "SELECT * FROM claim_revisions WHERE claim_id=? ORDER BY revision_no ASC",
        (claim_id,),
    )

    raw_relations = _query_all(
        db,
        """
        SELECT * FROM claim_relations
        WHERE source_claim_id=? OR target_claim_id=?
        ORDER BY created_at ASC, id ASC
        """,
        (claim_id, claim_id),
    )
    enriched_relations: list[dict[str, Any]] = []
    for rel in raw_relations:
        outgoing = rel["source_claim_id"] == claim_id
        peer_id = rel["target_claim_id"] if outgoing else rel["source_claim_id"]
        peer_claim = _query_one(
            db,
            "SELECT id, statement, epistemic_type, status FROM claims WHERE id=?",
            (peer_id,),
        )
        entry = dict(rel)
        entry["direction"] = "outgoing" if outgoing else "incoming"
        entry["related_claim"] = peer_claim
        enriched_relations.append(entry)

    return {
        "claim": claim,
        "sources": enriched_sources,
        "revisions": revisions,
        "relations": enriched_relations,
        "resolved_messages": resolved_messages,
    }


def export_witness_ledger(db: sqlite3.Connection) -> dict[str, Any]:
    """Export all Witness Ledger tables as a deterministic JSON-compatible dict."""
    return {
        "schema_version": 1,
        "exported_at": _utc_now(),
        "claims": _query_all(db, "SELECT * FROM claims ORDER BY created_at ASC, id ASC"),
        "sources": _query_all(
            db, "SELECT * FROM claim_sources ORDER BY created_at ASC, id ASC"
        ),
        "revisions": _query_all(
            db, "SELECT * FROM claim_revisions ORDER BY claim_id ASC, revision_no ASC"
        ),
        "relations": _query_all(
            db, "SELECT * FROM claim_relations ORDER BY created_at ASC, id ASC"
        ),
    }
