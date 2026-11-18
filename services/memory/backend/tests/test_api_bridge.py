from fastapi.testclient import TestClient

from app import main
from app.config import Settings
from app.db import create_archive, init_db, save_knowledge


def _configure_memory_app(monkeypatch, tmp_path):
    settings = Settings(data_dir=tmp_path)
    monkeypatch.setattr("app.config.get_settings", lambda: settings)
    monkeypatch.setattr("app.db.get_settings", lambda: settings)
    monkeypatch.setattr("app.moonwitness.get_settings", lambda: settings)
    monkeypatch.setattr("app.embeddings.get_settings", lambda: settings)
    monkeypatch.setattr(main, "settings", settings)
    init_db()
    return settings


def test_memory_bridge_endpoints_and_cors_for_port_3005(monkeypatch, tmp_path):
    _configure_memory_app(monkeypatch, tmp_path)
    archive, created = create_archive("export.zip", str(tmp_path / "export.zip"), 42, "a" * 64)
    assert created
    save_knowledge(
        archive["id"],
        "conv-1",
        {
            "id": "know-1",
            "kind": "architecture",
            "title": "Unified Monorepo Consolidation",
            "summary": "All ecosystem services bind cleanly without port conflicts.",
            "content": "apps/memory web runs on 3005 while FastAPI serves 8000.",
            "tags": ["architecture", "ports"],
            "entities": ["moonwitness-memory"],
            "source_message_ids": [],
            "confidence": 0.95,
        },
    )

    with TestClient(main.app) as client:
        health = client.get("/health", headers={"Origin": "http://localhost:3005"})
        assert health.status_code == 200
        assert health.json() == {"status": "ok", "mode": "local-first"}
        assert health.headers.get("access-control-allow-origin") == "http://localhost:3005"

        dashboard = client.get("/api/dashboard")
        assert dashboard.status_code == 200
        assert dashboard.json()["knowledge"] == 1

        records = client.get("/api/knowledge?limit=10")
        assert records.status_code == 200
        payload = records.json()
        assert len(payload) == 1
        assert payload[0]["title"] == "Unified Monorepo Consolidation"
        assert payload[0]["tags"] == ["architecture", "ports"]

        search = client.get("/api/search?q=Consolidation")
        assert search.status_code == 200
        assert search.json()[0]["id"] == "know-1"

        ndjson = client.get("/api/export.ndjson")
        assert ndjson.status_code == 200
        assert "application/x-ndjson" in ndjson.headers["content-type"]
        assert "Unified Monorepo Consolidation" in ndjson.text


def test_witness_ledger_api_endpoints_and_verification(monkeypatch, tmp_path):
    settings = _configure_memory_app(monkeypatch, tmp_path)
    monkeypatch.setenv("MOONWITNESS_SYNC_URL", "")
    settings.moonwitness_sync_url = ""

    with TestClient(main.app) as client:
        unsourced = client.post(
            "/api/witness/claims",
            json={
                "statement": "Signal repeater alpha runs on 144.39 MHz.",
                "epistemic_type": "hypothesis",
            },
        )
        assert unsourced.status_code == 201
        claim_a = unsourced.json()
        assert claim_a["status"] == "unverified"

        sourced = client.post(
            "/api/witness/claims",
            json={
                "statement": "Repeater alpha transmitted at 144.390 MHz in night log.",
                "epistemic_type": "fact",
                "source": {
                    "archive_id": "arc-w1",
                    "message_id": "msg-w1",
                    "excerpt": "transmitted at 144.390 MHz",
                    "attribution": "operator-log",
                },
            },
        )
        assert sourced.status_code == 201
        claim_b = sourced.json()
        assert claim_b["status"] == "active"

        listed = client.get("/api/witness/claims?q=144.39")
        assert listed.status_code == 200
        assert len(listed.json()["claims"]) == 2
        assert "hypothesis" in listed.json()["epistemic_types"]

        verified = client.post(
            "/api/witness/verify",
            json={
                "claim_id": claim_a["id"],
                "action": "verify",
                "reason": "Cross-checked against primary archive log",
                "source": {
                    "archive_id": "arc-w1",
                    "message_id": "msg-w2",
                    "excerpt": "144.39 MHz verified",
                },
            },
        )
        assert verified.status_code == 200
        assert verified.json()["claim"]["status"] == "active"

        rel = client.post(
            "/api/witness/relations",
            json={
                "source_claim_id": claim_a["id"],
                "target_claim_id": claim_b["id"],
                "relation_type": "supports",
                "note": "Both describe the same night watch transmission.",
            },
        )
        assert rel.status_code == 201

        lineage = client.get(f"/api/witness/claims/{claim_a['id']}/lineage")
        assert lineage.status_code == 200
        assert len(lineage.json()["sources"]) == 1
        assert len(lineage.json()["revisions"]) == 1
        assert len(lineage.json()["relations"]) == 1

        exported = client.get("/api/witness/export.json")
        assert exported.status_code == 200
        assert len(exported.json()["claims"]) == 2


