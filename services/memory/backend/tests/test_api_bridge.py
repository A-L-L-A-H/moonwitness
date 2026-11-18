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

