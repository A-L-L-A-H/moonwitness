import hashlib
import logging
import re
from pathlib import Path
from typing import Annotated
from urllib.parse import unquote
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from . import config
from .auth import Actor, authenticate_request
from .config import Settings, get_settings
from .db import (
    connection,
    create_archive,
    create_backup_job,
    dashboard_counts,
    decode_knowledge_row,
    get_knowledge_by_ids,
    get_knowledge_sources,
    init_db,
    list_rows,
    search_knowledge,
    update_job,
)
from .embeddings import search_vectors
from .moonwitness import export_corpus, sync_to_moonwitness, sync_witness_claims
from .witness_ledger import (
    CLAIM_STATUSES,
    EPISTEMIC_TYPES,
    RELATION_TYPES,
    add_claim_source,
    create_claim,
    export_witness_ledger,
    link_claims,
    list_claims,
    revise_claim,
    trace_claim_provenance,
)

log = logging.getLogger(__name__)
settings = get_settings()
_initial_settings = settings


def _active_settings() -> Settings:
    if settings is not _initial_settings:
        return settings
    return config.get_settings()


def resolve_actor(request: Request) -> Actor | None:
    """Resolve the request caller from MoonWitness ID Bearer JWT or bridge secret."""
    return authenticate_request(request, _active_settings())


app = FastAPI(
    title="MoonWitness Memory API",
    version="0.2.0",
    description="Local-first archive ingestion, traceable knowledge extraction and export.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Archive-Filename",
        "X-Moonwitness-Bridge-Token",
    ],
)
api_router = APIRouter(prefix="/api", dependencies=[Depends(resolve_actor)])


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "mode": "local-first"}


@api_router.get("/me")
def me(actor: Annotated[Actor | None, Depends(resolve_actor)]):
    if actor is None:
        return {"authenticated": False, "mode": "local-first"}
    return actor.to_dict()


@api_router.get("/system")
def system_status():
    active_settings = _active_settings()
    drive_config = active_settings.data_dir / "rclone" / "rclone.conf"
    return {
        "mode": "sso-required" if active_settings.memory_require_auth else "local-first",
        "auth_required": active_settings.memory_require_auth,
        "mid_issuer_url": active_settings.mid_issuer_url.strip().rstrip("/"),
        "gemini_configured": bool(active_settings.gemini_api_key),
        "gemini_model": active_settings.gemini_model,
        "embeddings_enabled": active_settings.enable_embeddings,
        "embedding_model": active_settings.embedding_model if active_settings.enable_embeddings else None,
        "drive_configured": drive_config.is_file(),
        "moonwitness_sync_configured": bool(active_settings.moonwitness_sync_url),
        "max_upload_gb": active_settings.max_upload_gb,
    }


@api_router.get("/dashboard")
def dashboard():
    return dashboard_counts()


@api_router.get("/archives")
def archives(limit: int = 100):
    rows = list_rows("archives", max(1, min(limit, 500)))
    # Never expose container filesystem paths to dashboard/API consumers.
    fields = ("id", "file_name", "size_bytes", "sha256", "status", "drive_status", "drive_key", "drive_error", "created_at")
    return [{key: row.get(key) for key in fields} for row in rows]


@api_router.get("/jobs")
def jobs(limit: int = 100):
    return list_rows("jobs", max(1, min(limit, 500)))


@api_router.get("/knowledge")
def knowledge(limit: int = 100):
    rows = list_rows("knowledge", max(1, min(limit, 500)))
    return [decode_knowledge_row(row) for row in rows]


@api_router.get("/knowledge/{knowledge_id}/sources")
def knowledge_sources(knowledge_id: str):
    result = get_knowledge_sources(knowledge_id)
    if not result:
        raise HTTPException(status_code=404, detail="Knowledge record not found")
    return result


@api_router.get("/search")
def search(q: str, limit: int = 30):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query is required")
    bounded_limit = max(1, min(limit, 100))
    keyword_results = [
        decode_knowledge_row(row)
        for row in search_knowledge(q.strip(), bounded_limit)
    ]
    seen = {row["id"] for row in keyword_results}
    vector_ids = [item_id for item_id in search_vectors(q.strip(), bounded_limit) if item_id not in seen]
    semantic_results = [
        decode_knowledge_row(row)
        for row in get_knowledge_by_ids(vector_ids[: max(0, bounded_limit - len(keyword_results))])
    ]
    return keyword_results + semantic_results


@api_router.get("/export.ndjson")
def download_knowledge_export():
    """MoonWitness and other clients can pull the full corpus as streamed NDJSON."""
    path = export_corpus()
    return FileResponse(
        path,
        media_type="application/x-ndjson",
        filename="moonwitness-knowledge.ndjson",
        headers={"Cache-Control": "no-store"},
    )


@api_router.post("/archives")
async def upload_archive(request: Request):
    """Stream raw request bytes to disk; avoids multipart temp-file duplication."""
    active_settings = _active_settings()
    active_settings.inbox_dir.mkdir(parents=True, exist_ok=True)
    raw_name = request.headers.get("x-archive-filename", "archive.zip")
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", Path(unquote(raw_name)).name).strip(".-")
    safe_name = safe_name or "archive.zip"
    if Path(safe_name).suffix.lower() not in {".zip", ".json"}:
        raise HTTPException(status_code=415, detail="Only .zip ChatGPT exports and standalone conversations.json files are supported")

    temp_path = active_settings.inbox_dir / f".{uuid4().hex}.upload"
    final_path = active_settings.inbox_dir / f"{uuid4().hex}-{safe_name}"
    digest = hashlib.sha256()
    size = 0
    try:
        with temp_path.open("wb") as output:
            async for chunk in request.stream():
                if not chunk:
                    continue
                size += len(chunk)
                if size > active_settings.max_upload_bytes:
                    raise HTTPException(status_code=413, detail=f"Archive exceeds configured limit ({active_settings.max_upload_gb} GB)")
                digest.update(chunk)
                output.write(chunk)

        if size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        sha = digest.hexdigest()
        existing = next((row for row in list_rows("archives", 5000) if row["sha256"] == sha), None)
        if existing:
            temp_path.unlink(missing_ok=True)
            return {"duplicate": True, "archive": {key: existing.get(key) for key in ("id", "file_name", "size_bytes", "status", "drive_status", "created_at")}}

        temp_path.replace(final_path)
        archive, created = create_archive(safe_name, str(final_path), size, sha)
        if not created:
            final_path.unlink(missing_ok=True)
            public_fields = ("id", "file_name", "size_bytes", "status", "drive_status", "created_at")
            return {"duplicate": True, "archive": {key: archive.get(key) for key in public_fields}}
        archive["sha256"] = sha
        return {"duplicate": False, "archive": archive, "message": "Archive queued for background processing"}
    except HTTPException:
        temp_path.unlink(missing_ok=True)
        raise
    except Exception:
        temp_path.unlink(missing_ok=True)
        final_path.unlink(missing_ok=True)
        log.exception("Archive upload failed")
        raise HTTPException(status_code=500, detail="Archive upload failed")


@api_router.post("/archives/{archive_id}/backup")
def backup_archive(archive_id: str):
    archive = next((row for row in list_rows("archives", 5000) if row["id"] == archive_id), None)
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    if archive["drive_status"] == "uploaded":
        return {"status": "already_uploaded", "archive_id": archive_id}
    job_id = create_backup_job(archive_id)
    if not job_id:
        raise HTTPException(status_code=404, detail="Archive not found")
    return {"status": "queued", "archive_id": archive_id, "job_id": job_id}


@api_router.post("/jobs/{job_id}/resume")
def resume_job(job_id: str):
    rows = list_rows("jobs", 5000)
    job = next((row for row in rows if row["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] not in {"awaiting_ai", "retry", "failed"}:
        raise HTTPException(status_code=409, detail=f"Job cannot be resumed from {job['status']}")
    # Preserve the checkpoint so retries do not repeat completed conversations.
    update_job(job_id, status="pending", attempts=0, error=None)
    return {"status": "queued", "job_id": job_id}


class WitnessSourceInput(BaseModel):
    archive_id: str = Field(min_length=1, max_length=200)
    message_id: str = Field(min_length=1, max_length=200)
    excerpt: str = Field(min_length=1, max_length=8000)
    offset_start: int | None = Field(default=None, ge=0)
    offset_end: int | None = Field(default=None, ge=0)
    attribution: str = Field(default="", max_length=300)
    rationale: str = Field(default="", max_length=1000)


class WitnessClaimCreateInput(BaseModel):
    statement: str = Field(min_length=1, max_length=4000)
    epistemic_type: str = Field(default="testimony", min_length=1, max_length=40)
    source: WitnessSourceInput | None = None
    valid_from: str | None = Field(default=None, max_length=80)
    valid_until: str | None = Field(default=None, max_length=80)
    status: str | None = Field(default=None, max_length=40)


class WitnessClaimReviseInput(BaseModel):
    new_statement: str = Field(min_length=1, max_length=4000)
    new_epistemic_type: str | None = Field(default=None, max_length=40)
    reason: str = Field(min_length=1, max_length=1000)
    new_status: str | None = Field(default=None, max_length=40)


class WitnessRelationCreateInput(BaseModel):
    source_claim_id: str = Field(min_length=1, max_length=200)
    target_claim_id: str = Field(min_length=1, max_length=200)
    relation_type: str = Field(min_length=1, max_length=40)
    note: str = Field(default="", max_length=1000)


class WitnessVerifyInput(BaseModel):
    claim_id: str | None = Field(default=None, max_length=200)
    action: str = Field(default="verify", pattern="^(verify|dispute|supersede|sync)$")
    reason: str = Field(default="", max_length=1000)
    source: WitnessSourceInput | None = None
    archive_id: str | None = Field(default=None, max_length=200)
    sync: bool = False


def _witness_error(exc: ValueError) -> HTTPException:
    detail = str(exc)
    status_code = 404 if "not found" in detail.lower() else 400
    return HTTPException(status_code=status_code, detail=detail)


@api_router.get("/witness/claims")
def witness_list_claims(
    epistemic_type: str | None = None,
    status: str | None = None,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
):
    try:
        with connection() as db:
            claims = list_claims(
                db,
                epistemic_type=epistemic_type.strip() if epistemic_type else None,
                status=status.strip() if status else None,
                q=q,
                limit=limit,
                offset=offset,
            )
    except ValueError as exc:
        raise _witness_error(exc) from exc
    return {
        "claims": claims,
        "epistemic_types": list(EPISTEMIC_TYPES),
        "statuses": list(CLAIM_STATUSES),
        "relation_types": list(RELATION_TYPES),
    }


@api_router.post("/witness/claims", status_code=201)
def witness_create_claim(body: WitnessClaimCreateInput):
    try:
        with connection() as db:
            return create_claim(
                db,
                statement=body.statement,
                epistemic_type=body.epistemic_type,
                source=body.source.model_dump() if body.source else None,
                valid_from=body.valid_from,
                valid_until=body.valid_until,
                status=body.status,
            )
    except ValueError as exc:
        raise _witness_error(exc) from exc


@api_router.get("/witness/claims/{claim_id}/lineage")
def witness_claim_lineage(claim_id: str):
    with connection() as db:
        lineage = trace_claim_provenance(db, claim_id)
    if not lineage:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")
    return lineage


@api_router.post("/witness/claims/{claim_id}/revise")
def witness_revise_claim(claim_id: str, body: WitnessClaimReviseInput):
    try:
        with connection() as db:
            return revise_claim(
                db,
                claim_id,
                new_statement=body.new_statement,
                new_epistemic_type=body.new_epistemic_type,
                reason=body.reason,
                new_status=body.new_status,
            )
    except ValueError as exc:
        raise _witness_error(exc) from exc


@api_router.post("/witness/relations", status_code=201)
def witness_link_claims(body: WitnessRelationCreateInput):
    try:
        with connection() as db:
            return link_claims(
                db,
                body.source_claim_id,
                body.target_claim_id,
                body.relation_type,
                body.note,
            )
    except ValueError as exc:
        raise _witness_error(exc) from exc


@api_router.post("/witness/verify")
def witness_verify_claim(body: WitnessVerifyInput):
    updated_claim: dict | None = None
    added_source: dict | None = None

    if body.action != "sync":
        if not body.claim_id:
            raise HTTPException(status_code=400, detail="claim_id is required")
        next_status_map = {
            "verify": "active",
            "dispute": "disputed",
            "supersede": "superseded",
        }
        next_status = next_status_map[body.action]
        default_reason = f"Witness Ledger {body.action} transition"
        try:
            with connection() as db:
                if body.source is not None:
                    added_source = add_claim_source(db, body.claim_id, body.source.model_dump())
                lineage = trace_claim_provenance(db, body.claim_id)
                if not lineage:
                    raise ValueError(f"Claim '{body.claim_id}' not found")
                updated_claim = revise_claim(
                    db,
                    body.claim_id,
                    new_statement=lineage["claim"]["statement"],
                    new_epistemic_type=lineage["claim"]["epistemic_type"],
                    reason=body.reason.strip() or default_reason,
                    new_status=next_status,
                )
        except ValueError as exc:
            raise _witness_error(exc) from exc

    sync_result: dict[str, int | bool | str] = {"triggered": False, "synced": 0}
    if body.sync or body.action == "sync":
        active_settings = _active_settings()
        if active_settings.moonwitness_sync_url:
            synced = (
                sync_to_moonwitness(body.archive_id)
                if body.archive_id
                else sync_witness_claims()
            )
            sync_result = {"triggered": True, "synced": synced}

    return {
        "ok": True,
        "action": body.action,
        "claim": updated_claim,
        "source": added_source,
        "sync": sync_result,
    }


@api_router.get("/witness/export.json")
def witness_export():
    with connection() as db:
        return export_witness_ledger(db)


app.include_router(api_router)
