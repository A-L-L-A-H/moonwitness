import json
from pathlib import Path
from typing import Any

import httpx

from .config import Settings, get_settings
from .db import connection, iter_knowledge_records, utc_now
from .witness_ledger import export_witness_ledger


def export_corpus() -> Path:
    """Write the complete knowledge corpus without loading it all into RAM."""
    settings = get_settings()
    settings.export_dir.mkdir(parents=True, exist_ok=True)
    target = settings.export_dir / "moonwitness-knowledge.ndjson"
    temporary = target.with_suffix(target.suffix + ".tmp")
    try:
        with temporary.open("w", encoding="utf-8") as handle:
            for record in iter_knowledge_records(batch_size=250):
                handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return target


def _build_sync_headers(settings: Settings) -> dict[str, str]:
    if not settings.moonwitness_sync_token:
        raise RuntimeError(
            "MOONWITNESS_SYNC_TOKEN is required when MOONWITNESS_SYNC_URL is configured"
        )
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {settings.moonwitness_sync_token}",
    }


def sync_to_moonwitness(archive_id: str) -> int:
    """Push one archive to a configured receiver in bounded, retryable batches."""
    settings = get_settings()
    if not settings.moonwitness_sync_url:
        return 0
    headers = _build_sync_headers(settings)

    synced = 0
    batch: list[dict[str, Any]] = []
    with httpx.Client(timeout=httpx.Timeout(60.0, connect=15.0)) as client:
        for record in iter_knowledge_records(archive_id=archive_id, batch_size=settings.moonwitness_batch_size):
            batch.append(record)
            if len(batch) < max(1, settings.moonwitness_batch_size):
                continue
            _send_batch(client, headers, batch)
            _mark_synced(batch)
            synced += len(batch)
            batch = []

        if batch:
            _send_batch(client, headers, batch)
            _mark_synced(batch)
            synced += len(batch)
    return synced


def sync_witness_claims() -> int:
    """Push Witness Ledger claims to MOONWITNESS_SYNC_URL if configured."""
    settings = get_settings()
    if not settings.moonwitness_sync_url:
        return 0
    headers = _build_sync_headers(settings)

    with connection() as db:
        exported = export_witness_ledger(db)

    source_counts: dict[str, int] = {}
    for src in exported["sources"]:
        cid = src["claim_id"]
        source_counts[cid] = source_counts.get(cid, 0) + 1

    revision_counts: dict[str, int] = {}
    for rev in exported["revisions"]:
        cid = rev["claim_id"]
        revision_counts[cid] = revision_counts.get(cid, 0) + 1

    records: list[dict[str, Any]] = []
    for claim in exported["claims"]:
        cid = claim["id"]
        scount = source_counts.get(cid, 0)
        rcount = revision_counts.get(cid, 0)
        records.append({
            "id": f"witness-claim:{cid}",
            "record_key": f"witness-claim:{cid}",
            "kind": f"witness.{claim['epistemic_type']}",
            "title": claim["statement"][:140],
            "summary": f"[{claim['epistemic_type']} · {claim['status']}] {scount} source(s), {rcount} revision(s)",
            "content": claim["statement"],
            "tags": [claim["epistemic_type"], claim["status"], "witness-ledger"],
            "entities": [],
            "source_message_ids": [],
            "confidence": 1.0 if claim["status"] == "active" else 0.5,
            "metadata": {
                "claim_id": cid,
                "epistemic_type": claim["epistemic_type"],
                "status": claim["status"],
                "valid_from": claim.get("valid_from"),
                "valid_until": claim.get("valid_until"),
            },
            "created_at": claim["created_at"],
            "updated_at": claim["updated_at"],
        })

    if not records:
        return 0

    batch_size = max(1, settings.moonwitness_batch_size)
    synced = 0
    with httpx.Client(timeout=httpx.Timeout(60.0, connect=15.0)) as client:
        for offset in range(0, len(records), batch_size):
            batch = records[offset:offset + batch_size]
            _send_batch(client, headers, batch)
            synced += len(batch)
    return synced


def _send_batch(client: httpx.Client, headers: dict[str, str], batch: list[dict[str, Any]]) -> None:
    response = client.post(
        get_settings().moonwitness_sync_url,
        headers=headers,
        json={
            "source": "moonwitness-memory",
            "schema_version": 1,
            "records": batch,
        },
    )
    response.raise_for_status()


def _mark_synced(batch: list[dict[str, Any]]) -> None:
    now = utc_now()
    with connection() as db:
        db.executemany(
            "UPDATE knowledge SET synced_at=? WHERE id=?",
            [(now, item["id"]) for item in batch],
        )
