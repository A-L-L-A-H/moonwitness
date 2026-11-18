import base64
import json
import time
from typing import Any

import httpx
import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from fastapi.testclient import TestClient

from app import auth, main
from app.config import Settings
from app.db import init_db


def _b64url_encode(raw_bytes: bytes) -> str:
    return base64.urlsafe_b64encode(raw_bytes).rstrip(b"=").decode("ascii")


def _generate_es256_keypair(kid: str) -> tuple[ec.EllipticCurvePrivateKey, dict[str, Any]]:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_numbers = private_key.public_key().public_numbers()
    jwk_payload = {
        "kty": "EC",
        "crv": "P-256",
        "x": _b64url_encode(public_numbers.x.to_bytes(32, "big")),
        "y": _b64url_encode(public_numbers.y.to_bytes(32, "big")),
        "kid": kid,
        "use": "sig",
        "alg": "ES256",
    }
    return private_key, jwk_payload


def _sign_es256_jwt(
    private_key: ec.EllipticCurvePrivateKey,
    kid: str,
    claims: dict[str, Any],
    header_overrides: dict[str, Any] | None = None,
) -> str:
    header: dict[str, Any] = {"alg": "ES256", "typ": "JWT", "kid": kid}
    if header_overrides:
        header.update(header_overrides)
    header_segment = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_segment = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    der_signature = private_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))
    sig_r, sig_s = decode_dss_signature(der_signature)
    raw_signature = sig_r.to_bytes(32, "big") + sig_s.to_bytes(32, "big")
    return f"{header_segment}.{payload_segment}.{_b64url_encode(raw_signature)}"


class _FakeJwksClient:
    def __init__(self, handler) -> None:
        self._handler = handler

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> bool:
        return False

    def get(self, url: str, headers: dict[str, str] | None = None) -> httpx.Response:
        return self._handler(url, headers or {})


@pytest.fixture(autouse=True)
def _reset_auth_cache():
    auth.reset_jwks_cache()
    yield
    auth.reset_jwks_cache()


def _configure_app(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
    *,
    memory_require_auth: bool = False,
    mid_issuer_url: str = "https://id.moonwitness.biz.id",
    mid_jwks_cache_ttl_seconds: int = 300,
    mid_audience: str = "moonwitness-memory",
    mid_allowed_audiences: str = "",
    moonwitness_sync_token: str = "",
) -> Settings:
    configured = Settings(
        data_dir=tmp_path,
        memory_require_auth=memory_require_auth,
        mid_issuer_url=mid_issuer_url,
        mid_jwks_cache_ttl_seconds=mid_jwks_cache_ttl_seconds,
        mid_audience=mid_audience,
        mid_allowed_audiences=mid_allowed_audiences,
        moonwitness_sync_token=moonwitness_sync_token,
    )
    monkeypatch.setattr("app.config.get_settings", lambda: configured)
    monkeypatch.setattr("app.db.get_settings", lambda: configured)
    monkeypatch.setattr("app.moonwitness.get_settings", lambda: configured)
    monkeypatch.setattr("app.embeddings.get_settings", lambda: configured)
    monkeypatch.setattr(main, "settings", configured)
    init_db()
    return configured


def _install_jwks_mock(monkeypatch: pytest.MonkeyPatch, jwks_provider) -> list[str]:
    fetched_urls: list[str] = []

    def handle_get(url: str, _headers: dict[str, str]) -> httpx.Response:
        fetched_urls.append(url)
        status_code, payload = jwks_provider()
        request = httpx.Request("GET", url)
        return httpx.Response(status_code=status_code, json=payload, request=request)

    monkeypatch.setattr(auth.httpx, "Client", lambda **_kwargs: _FakeJwksClient(handle_get))
    return fetched_urls


def _default_claims(**overrides: Any) -> dict[str, Any]:
    now_sec = int(time.time())
    claims: dict[str, Any] = {
        "iss": "https://id.moonwitness.biz.id",
        "sub": "42",
        "aud": "moonwitness-memory",
        "iat": now_sec - 10,
        "exp": now_sec + 600,
        "token_use": "access",
        "preferred_username": "witness-op",
        "role": "admin",
    }
    claims.update(overrides)
    return claims


def test_local_first_mode_allows_unauthenticated_and_rejects_invalid_bearer(monkeypatch, tmp_path):
    _configure_app(monkeypatch, tmp_path, memory_require_auth=False)
    private_key, public_jwk = _generate_es256_keypair("mid-local-1")
    _install_jwks_mock(monkeypatch, lambda: (200, {"keys": [public_jwk]}))
    valid_token = _sign_es256_jwt(private_key, "mid-local-1", _default_claims())

    with TestClient(main.app) as client:
        unauth_me = client.get("/api/me")
        assert unauth_me.status_code == 200
        assert unauth_me.json() == {"authenticated": False, "mode": "local-first"}

        auth_me = client.get("/api/me", headers={"Authorization": f"Bearer {valid_token}"})
        assert auth_me.status_code == 200
        assert auth_me.json() == {
            "authenticated": True,
            "sub": "42",
            "username": "witness-op",
            "role": "admin",
            "issuer": "https://id.moonwitness.biz.id",
        }

        for method, path in (
            ("GET", "/api/me"),
            ("GET", "/api/knowledge"),
            ("GET", "/api/export.ndjson"),
            ("POST", "/api/archives"),
            ("POST", "/api/archives/missing/backup"),
            ("POST", "/api/jobs/missing/resume"),
        ):
            rejected = client.request(
                method,
                path,
                headers={"Authorization": "Bearer malformed.invalid.token"},
            )
            assert rejected.status_code == 401
            assert rejected.headers.get("www-authenticate") == "Bearer"


def test_required_auth_protects_all_api_routes_while_keeping_health_public(monkeypatch, tmp_path):
    _configure_app(monkeypatch, tmp_path, memory_require_auth=True)
    private_key, public_jwk = _generate_es256_keypair("mid-prod-1")
    _install_jwks_mock(monkeypatch, lambda: (200, {"keys": [public_jwk]}))
    valid_token = _sign_es256_jwt(private_key, "mid-prod-1", _default_claims())
    auth_headers = {"Authorization": f"Bearer {valid_token}"}

    with TestClient(main.app) as client:
        health_response = client.get("/health")
        assert health_response.status_code == 200
        assert health_response.json() == {"status": "ok", "mode": "local-first"}

        protected_requests = (
            ("GET", "/api/me"),
            ("GET", "/api/system"),
            ("GET", "/api/dashboard"),
            ("GET", "/api/archives"),
            ("GET", "/api/jobs"),
            ("GET", "/api/knowledge"),
            ("GET", "/api/knowledge/know-1/sources"),
            ("GET", "/api/search?q=moon"),
            ("GET", "/api/export.ndjson"),
            ("POST", "/api/archives"),
            ("POST", "/api/archives/arch-1/backup"),
            ("POST", "/api/jobs/job-1/resume"),
        )
        for method, path in protected_requests:
            unauth_response = client.request(method, path)
            assert unauth_response.status_code == 401, f"{method} {path} must reject missing auth"

        me_response = client.get("/api/me", headers=auth_headers)
        assert me_response.status_code == 200
        assert me_response.json()["authenticated"] is True

        system_response = client.get("/api/system", headers=auth_headers)
        assert system_response.status_code == 200
        assert system_response.json()["auth_required"] is True

        dashboard_response = client.get("/api/dashboard", headers=auth_headers)
        assert dashboard_response.status_code == 200

        upload_response = client.post(
            "/api/archives",
            headers={
                **auth_headers,
                "Content-Type": "application/octet-stream",
                "X-Archive-Filename": "conversations.json",
            },
            content=b"[]",
        )
        assert upload_response.status_code == 200
        assert upload_response.json()["duplicate"] is False
        created_archive = upload_response.json()["archive"]

        backup_response = client.post(
            f"/api/archives/{created_archive['id']}/backup",
            headers=auth_headers,
        )
        assert backup_response.status_code == 200
        assert backup_response.json()["status"] == "queued"

        resume_missing = client.post("/api/jobs/nonexistent/resume", headers=auth_headers)
        assert resume_missing.status_code == 404

        export_response = client.get("/api/export.ndjson", headers=auth_headers)
        assert export_response.status_code == 200


def test_jwks_ttl_cache_and_key_miss_rotation_refresh(monkeypatch, tmp_path):
    _configure_app(
        monkeypatch,
        tmp_path,
        memory_require_auth=True,
        mid_jwks_cache_ttl_seconds=300,
    )
    key_v1, jwk_v1 = _generate_es256_keypair("mid-rot-1")
    key_v2, jwk_v2 = _generate_es256_keypair("mid-rot-2")
    active_jwks = [jwk_v1]
    monotonic_clock = {"now": 1000.0}

    monkeypatch.setattr(auth.time, "monotonic", lambda: monotonic_clock["now"])
    fetched_urls = _install_jwks_mock(monkeypatch, lambda: (200, {"keys": list(active_jwks)}))

    token_v1 = _sign_es256_jwt(key_v1, "mid-rot-1", _default_claims())
    token_v2 = _sign_es256_jwt(key_v2, "mid-rot-2", _default_claims())

    with TestClient(main.app) as client:
        first_call = client.get("/api/me", headers={"Authorization": f"Bearer {token_v1}"})
        assert first_call.status_code == 200
        assert fetched_urls == ["https://id.moonwitness.biz.id/.well-known/jwks.json"]

        # Within TTL, same kid must hit the in-memory JWKS cache.
        monotonic_clock["now"] = 1050.0
        cached_call = client.get("/api/me", headers={"Authorization": f"Bearer {token_v1}"})
        assert cached_call.status_code == 200
        assert len(fetched_urls) == 1

        # Rotate key on issuer within TTL -> unseen kid triggers key-miss JWKS refresh.
        active_jwks = [jwk_v1, jwk_v2]
        rotated_call = client.get("/api/me", headers={"Authorization": f"Bearer {token_v2}"})
        assert rotated_call.status_code == 200
        assert len(fetched_urls) == 2

        # Subsequent call with rotated key hits cache.
        monotonic_clock["now"] = 1100.0
        rotated_cached = client.get("/api/me", headers={"Authorization": f"Bearer {token_v2}"})
        assert rotated_cached.status_code == 200
        assert len(fetched_urls) == 2

        # Advancing past TTL expires the cache and triggers a fresh fetch.
        monotonic_clock["now"] = 1500.0
        ttl_refreshed = client.get("/api/me", headers={"Authorization": f"Bearer {token_v2}"})
        assert ttl_refreshed.status_code == 200
        assert len(fetched_urls) == 3


def test_rejects_expired_wrong_sig_alg_issuer_token_use_and_jwks_outage(monkeypatch, tmp_path):
    _configure_app(monkeypatch, tmp_path, memory_require_auth=True)
    key_trusted, jwk_trusted = _generate_es256_keypair("mid-sec-1")
    key_rogue, _ = _generate_es256_keypair("mid-sec-1")
    jwks_status = {"code": 200}
    _install_jwks_mock(monkeypatch, lambda: (jwks_status["code"], {"keys": [jwk_trusted]}))

    now_sec = int(time.time())
    expired_token = _sign_es256_jwt(
        key_trusted, "mid-sec-1", _default_claims(exp=now_sec - 5)
    )
    future_nbf_token = _sign_es256_jwt(
        key_trusted, "mid-sec-1", _default_claims(nbf=now_sec + 120)
    )
    rogue_sig_token = _sign_es256_jwt(key_rogue, "mid-sec-1", _default_claims())
    wrong_issuer_token = _sign_es256_jwt(
        key_trusted, "mid-sec-1", _default_claims(iss="https://evil.example")
    )
    id_token_replay = _sign_es256_jwt(
        key_trusted, "mid-sec-1", _default_claims(token_use="id")
    )
    alg_none_token = _sign_es256_jwt(
        key_trusted, "mid-sec-1", _default_claims(), header_overrides={"alg": "none"}
    )
    unknown_kid_token = _sign_es256_jwt(key_trusted, "mid-unknown", _default_claims())

    valid_token = _sign_es256_jwt(key_trusted, "mid-sec-1", _default_claims())
    header_part, _payload_part, signature_part = valid_token.split(".")
    tampered_payload = _b64url_encode(
        json.dumps(_default_claims(role="superadmin"), separators=(",", ":")).encode("utf-8")
    )
    tampered_token = f"{header_part}.{tampered_payload}.{signature_part}"

    with TestClient(main.app) as client:
        invalid_tokens = (
            expired_token,
            future_nbf_token,
            rogue_sig_token,
            wrong_issuer_token,
            id_token_replay,
            alg_none_token,
            unknown_kid_token,
            tampered_token,
        )
        for token in invalid_tokens:
            rejected = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
            assert rejected.status_code == 401

        non_bearer = client.get("/api/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
        assert non_bearer.status_code == 401

        empty_bearer = client.get("/api/me", headers={"Authorization": "Bearer   "})
        assert empty_bearer.status_code == 401

        # Clear cache and simulate JWKS outage -> must fail closed with 401.
        auth.reset_jwks_cache()
        jwks_status["code"] = 503
        outage_response = client.get("/api/me", headers={"Authorization": f"Bearer {valid_token}"})
        assert outage_response.status_code == 401


def test_normalizes_trailing_slash_issuer_and_rejects_malformed_jwks(monkeypatch, tmp_path):
    _configure_app(
        monkeypatch,
        tmp_path,
        memory_require_auth=True,
        mid_issuer_url="https://id.moonwitness.biz.id/",
    )
    private_key, public_jwk = _generate_es256_keypair("mid-slash-1")
    jwks_payload: dict[str, Any] = {"keys": [{"kty": "RSA", "kid": "rsa-key"}, public_jwk]}
    fetched_urls = _install_jwks_mock(monkeypatch, lambda: (200, jwks_payload))
    valid_token = _sign_es256_jwt(private_key, "mid-slash-1", _default_claims())
    bool_exp_token = _sign_es256_jwt(private_key, "mid-slash-1", _default_claims(exp=True))

    with TestClient(main.app) as client:
        ok_response = client.get("/api/me", headers={"Authorization": f"Bearer {valid_token}"})
        assert ok_response.status_code == 200
        assert ok_response.json()["issuer"] == "https://id.moonwitness.biz.id"
        assert fetched_urls == ["https://id.moonwitness.biz.id/.well-known/jwks.json"]

        bool_exp_response = client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {bool_exp_token}"},
        )
        assert bool_exp_response.status_code == 401


def test_sync_token_shared_secret_and_cors_authorization_header(monkeypatch, tmp_path):
    _configure_app(
        monkeypatch,
        tmp_path,
        memory_require_auth=True,
        moonwitness_sync_token="sync-bridge-secret-value",
    )

    with TestClient(main.app) as client:
        bearer_ok = client.get(
            "/api/me",
            headers={"Authorization": "Bearer sync-bridge-secret-value"},
        )
        assert bearer_ok.status_code == 200
        assert bearer_ok.json() == {
            "authenticated": True,
            "sub": "moonwitness-sync",
            "username": "moonwitness-sync",
            "role": "service",
            "issuer": "shared-secret",
        }

        bridge_header_ok = client.get(
            "/api/export.ndjson",
            headers={"X-Moonwitness-Bridge-Token": "sync-bridge-secret-value"},
        )
        assert bridge_header_ok.status_code == 200

        wrong_bridge = client.get(
            "/api/knowledge",
            headers={"X-Moonwitness-Bridge-Token": "wrong-secret"},
        )
        assert wrong_bridge.status_code == 401

        preflight = client.options(
            "/api/archives",
            headers={
                "Origin": "http://localhost:3005",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization, Content-Type, X-Archive-Filename",
            },
        )
        assert preflight.status_code == 200
        allowed_headers = preflight.headers.get("access-control-allow-headers", "")
        assert "authorization" in allowed_headers.lower()


def test_enforces_mid_audience_and_allowed_audiences_policy(monkeypatch, tmp_path):
    private_key, public_jwk = _generate_es256_keypair("mid-aud-1")
    _install_jwks_mock(monkeypatch, lambda: (200, {"keys": [public_jwk]}))

    _configure_app(monkeypatch, tmp_path, memory_require_auth=True)
    memory_token = _sign_es256_jwt(private_key, "mid-aud-1", _default_claims())
    array_memory_token = _sign_es256_jwt(
        private_key,
        "mid-aud-1",
        _default_claims(aud=["moonwitness-memory", "moonwitness-api"]),
    )
    web_token = _sign_es256_jwt(
        private_key, "mid-aud-1", _default_claims(aud="moonwitness-web")
    )
    igate_token = _sign_es256_jwt(
        private_key, "mid-aud-1", _default_claims(aud="igate-console")
    )
    empty_str_aud = _sign_es256_jwt(private_key, "mid-aud-1", _default_claims(aud=""))
    empty_list_aud = _sign_es256_jwt(private_key, "mid-aud-1", _default_claims(aud=[]))
    malformed_list_aud = _sign_es256_jwt(
        private_key, "mid-aud-1", _default_claims(aud=["moonwitness-memory", 123])
    )
    no_aud_claims = _default_claims()
    no_aud_claims.pop("aud", None)
    missing_aud = _sign_es256_jwt(private_key, "mid-aud-1", no_aud_claims)

    with TestClient(main.app) as client:
        for ok_token in (memory_token, array_memory_token):
            ok_resp = client.get("/api/me", headers={"Authorization": f"Bearer {ok_token}"})
            assert ok_resp.status_code == 200

        for bad_token in (
            web_token,
            igate_token,
            empty_str_aud,
            empty_list_aud,
            malformed_list_aud,
            missing_aud,
        ):
            bad_resp = client.get("/api/me", headers={"Authorization": f"Bearer {bad_token}"})
            assert bad_resp.status_code == 401
            assert bad_resp.headers.get("www-authenticate") == "Bearer"

    # Override single mid_audience -> old moonwitness-memory token must fail closed.
    _configure_app(
        monkeypatch,
        tmp_path,
        memory_require_auth=True,
        mid_audience="custom-memory",
    )
    custom_token = _sign_es256_jwt(
        private_key, "mid-aud-1", _default_claims(aud="custom-memory")
    )
    with TestClient(main.app) as client:
        assert (
            client.get("/api/me", headers={"Authorization": f"Bearer {custom_token}"}).status_code
            == 200
        )
        assert (
            client.get("/api/me", headers={"Authorization": f"Bearer {memory_token}"}).status_code
            == 401
        )

    # Comma-separated mid_allowed_audiences supports explicit multi-client allowlisting.
    _configure_app(
        monkeypatch,
        tmp_path,
        memory_require_auth=True,
        mid_allowed_audiences="moonwitness-memory, moonwitness-web",
    )
    with TestClient(main.app) as client:
        assert (
            client.get("/api/me", headers={"Authorization": f"Bearer {memory_token}"}).status_code
            == 200
        )
        assert (
            client.get("/api/me", headers={"Authorization": f"Bearer {web_token}"}).status_code
            == 200
        )
        assert (
            client.get("/api/me", headers={"Authorization": f"Bearer {igate_token}"}).status_code
            == 401
        )

    # Empty audience policy fails closed.
    _configure_app(
        monkeypatch,
        tmp_path,
        memory_require_auth=True,
        mid_audience="",
        mid_allowed_audiences="",
    )
    with TestClient(main.app) as client:
        assert (
            client.get("/api/me", headers={"Authorization": f"Bearer {memory_token}"}).status_code
            == 401
        )
