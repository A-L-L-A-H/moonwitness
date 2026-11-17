import base64
import binascii
import hmac
import json
import math
import re
import threading
import time
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from fastapi import HTTPException, Request

from . import config
from .config import Settings

_B64URL_RE = re.compile(r"^[A-Za-z0-9_-]+$")
_EC_P256_COORD_BYTES = 32
_ES256_RAW_SIG_BYTES = 64


class TokenVerificationError(Exception):
    """Raised when an incoming MoonWitness ID JWT or JWKS payload fails validation."""


@dataclass(frozen=True, slots=True)
class Actor:
    """Authenticated caller resolved from a MoonWitness ID JWT or machine bridge secret."""

    sub: str
    username: str
    role: str
    issuer: str
    authenticated: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "authenticated": self.authenticated,
            "sub": self.sub,
            "username": self.username,
            "role": self.role,
            "issuer": self.issuer,
        }


@dataclass(slots=True)
class _JwksCacheEntry:
    url: str
    fetched_at: float
    keys: dict[str, ec.EllipticCurvePublicKey]


_jwks_lock = threading.Lock()
_jwks_cache: _JwksCacheEntry | None = None


def reset_jwks_cache() -> None:
    """Clear the cached JWKS keys so tests or rotations start from a clean state."""
    global _jwks_cache
    with _jwks_lock:
        _jwks_cache = None


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _b64url_decode(segment: str) -> bytes:
    if not segment or not _B64URL_RE.fullmatch(segment):
        raise TokenVerificationError("Invalid base64url segment")
    padded = segment + ("=" * (-len(segment) % 4))
    try:
        return base64.urlsafe_b64decode(padded.encode("ascii"))
    except (binascii.Error, ValueError) as exc:
        raise TokenVerificationError("Invalid base64url encoding") from exc


def _decode_json_segment(segment: str, segment_label: str) -> dict[str, Any]:
    raw_bytes = _b64url_decode(segment)
    try:
        parsed = json.loads(raw_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise TokenVerificationError(f"Malformed JWT {segment_label}") from exc
    if not isinstance(parsed, dict):
        raise TokenVerificationError(f"JWT {segment_label} must be a JSON object")
    return parsed


def _parse_ec_p256_jwk(jwk_entry: Any) -> tuple[str, ec.EllipticCurvePublicKey] | None:
    if not isinstance(jwk_entry, dict):
        return None
    if jwk_entry.get("kty") != "EC" or jwk_entry.get("crv") != "P-256":
        return None

    kid = jwk_entry.get("kid")
    if not isinstance(kid, str) or not kid.strip():
        return None

    use = jwk_entry.get("use")
    if use is not None and use != "sig":
        return None

    alg = jwk_entry.get("alg")
    if alg is not None and alg != "ES256":
        return None

    x_b64 = jwk_entry.get("x")
    y_b64 = jwk_entry.get("y")
    if not isinstance(x_b64, str) or not isinstance(y_b64, str):
        return None

    try:
        x_bytes = _b64url_decode(x_b64)
        y_bytes = _b64url_decode(y_b64)
    except TokenVerificationError:
        return None
    if len(x_bytes) != _EC_P256_COORD_BYTES or len(y_bytes) != _EC_P256_COORD_BYTES:
        return None

    try:
        numbers = ec.EllipticCurvePublicNumbers(
            int.from_bytes(x_bytes, "big"),
            int.from_bytes(y_bytes, "big"),
            ec.SECP256R1(),
        )
        return kid, numbers.public_key()
    except ValueError:
        return None


def _fetch_jwks(jwks_url: str) -> dict[str, ec.EllipticCurvePublicKey]:
    try:
        with httpx.Client(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            response = client.get(jwks_url, headers={"Accept": "application/json"})
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise TokenVerificationError("Failed to retrieve JWKS signing keys") from exc

    if not isinstance(payload, dict) or not isinstance(payload.get("keys"), list):
        raise TokenVerificationError("Invalid JWKS document")

    parsed_keys: dict[str, ec.EllipticCurvePublicKey] = {}
    for jwk_entry in payload["keys"]:
        parsed = _parse_ec_p256_jwk(jwk_entry)
        if parsed is not None:
            key_id, public_key = parsed
            parsed_keys[key_id] = public_key
    return parsed_keys


def resolve_jwk_by_kid(kid: str, issuer_url: str, ttl_seconds: int) -> ec.EllipticCurvePublicKey:
    """Resolve an ES256 public key from the cached issuer JWKS, refreshing on TTL expiry or key miss."""
    global _jwks_cache
    normalized_issuer = issuer_url.strip().rstrip("/")
    if not normalized_issuer:
        raise TokenVerificationError("MID issuer URL is not configured")
    jwks_url = f"{normalized_issuer}/.well-known/jwks.json"
    ttl = max(0, int(ttl_seconds))

    with _jwks_lock:
        now = time.monotonic()
        cache = _jwks_cache
        cache_fresh = (
            cache is not None
            and cache.url == jwks_url
            and ttl > 0
            and (now - cache.fetched_at) < ttl
        )
        if cache_fresh and kid in cache.keys:
            return cache.keys[kid]

        # Refresh when cache is stale/empty or when an unseen kid signals key rotation.
        fresh_keys = _fetch_jwks(jwks_url)
        _jwks_cache = _JwksCacheEntry(url=jwks_url, fetched_at=time.monotonic(), keys=fresh_keys)
        public_key = fresh_keys.get(kid)
        if public_key is None:
            raise TokenVerificationError("Unknown JWT signing key id")
        return public_key


def _is_numeric_timestamp(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def _normalize_expected_audiences(expected_audience: str | Sequence[str]) -> tuple[str, ...]:
    if isinstance(expected_audience, str):
        raw_items = expected_audience.split(",")
    else:
        raw_items = [item for item in expected_audience if isinstance(item, str)]
    return tuple(item.strip() for item in raw_items if item.strip())


def _extract_token_audiences(claims: dict[str, Any]) -> tuple[str, ...]:
    aud_claim = claims.get("aud")
    if isinstance(aud_claim, str):
        if not aud_claim.strip():
            raise TokenVerificationError("Invalid JWT audience")
        return (aud_claim,)
    if isinstance(aud_claim, list):
        if not aud_claim or any(
            not isinstance(item, str) or not item.strip() for item in aud_claim
        ):
            raise TokenVerificationError("Invalid JWT audience")
        return tuple(aud_claim)
    raise TokenVerificationError("Invalid JWT audience")


def verify_es256_jwt(
    token: str,
    issuer_url: str,
    ttl_seconds: int = 300,
    now_epoch_sec: float | None = None,
    expected_audience: str | Sequence[str] = "moonwitness-memory",
) -> Actor:
    """Verify an ES256 access token issued by MoonWitness ID and return the authenticated Actor."""
    segments = token.strip().split(".")
    if len(segments) != 3 or not all(segments):
        raise TokenVerificationError("Malformed JWT structure")

    header_segment, payload_segment, signature_segment = segments
    header = _decode_json_segment(header_segment, "header")
    if header.get("alg") != "ES256":
        raise TokenVerificationError("Unsupported JWT signing algorithm")

    kid = header.get("kid")
    if not isinstance(kid, str) or not kid.strip():
        raise TokenVerificationError("Missing JWT key identifier")

    claims = _decode_json_segment(payload_segment, "claims")
    expected_issuer = issuer_url.strip().rstrip("/")
    if not expected_issuer or claims.get("iss") != expected_issuer:
        raise TokenVerificationError("Invalid JWT issuer")
    if claims.get("token_use") != "access":
        raise TokenVerificationError("Invalid JWT token_use")

    allowed_audiences = _normalize_expected_audiences(expected_audience)
    if not allowed_audiences:
        raise TokenVerificationError("No allowed JWT audience configured")
    token_audiences = _extract_token_audiences(claims)
    if not any(aud in allowed_audiences for aud in token_audiences):
        raise TokenVerificationError("Invalid JWT audience")

    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise TokenVerificationError("Missing JWT subject")

    current_time = now_epoch_sec if now_epoch_sec is not None else time.time()
    exp = claims.get("exp")
    if not _is_numeric_timestamp(exp) or exp <= current_time:
        raise TokenVerificationError("Expired or invalid JWT exp claim")

    nbf = claims.get("nbf")
    if nbf is not None and (not _is_numeric_timestamp(nbf) or nbf > current_time):
        raise TokenVerificationError("JWT is not valid yet")

    raw_signature = _b64url_decode(signature_segment)
    if len(raw_signature) != _ES256_RAW_SIG_BYTES:
        raise TokenVerificationError("Invalid ES256 signature length")

    sig_r = int.from_bytes(raw_signature[:_EC_P256_COORD_BYTES], "big")
    sig_s = int.from_bytes(raw_signature[_EC_P256_COORD_BYTES:], "big")
    if sig_r <= 0 or sig_s <= 0:
        raise TokenVerificationError("Invalid ES256 signature scalar")

    public_key = resolve_jwk_by_kid(kid.strip(), expected_issuer, ttl_seconds)
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    der_signature = encode_dss_signature(sig_r, sig_s)
    try:
        public_key.verify(der_signature, signing_input, ec.ECDSA(hashes.SHA256()))
    except InvalidSignature as exc:
        raise TokenVerificationError("Invalid JWT signature") from exc

    username = claims.get("preferred_username") or claims.get("username") or claims.get("email") or sub
    role = claims.get("role") or "viewer"
    return Actor(
        sub=sub.strip(),
        username=str(username),
        role=str(role),
        issuer=expected_issuer,
        authenticated=True,
    )


def _matches_shared_secret(candidate: str, expected_secret: str) -> bool:
    if not candidate or not expected_secret:
        return False
    return hmac.compare_digest(candidate.encode("utf-8"), expected_secret.encode("utf-8"))


def authenticate_request(request: Request, active_settings: Settings | None = None) -> Actor | None:
    """Authenticate an HTTP request via MoonWitness ID ES256 JWT or configured bridge secret."""
    effective_settings = active_settings or config.get_settings()
    auth_header = request.headers.get("authorization")
    bridge_header = request.headers.get("x-moonwitness-bridge-token")
    sync_secret = effective_settings.moonwitness_sync_token.strip()

    if bridge_header is not None and not _matches_shared_secret(bridge_header.strip(), sync_secret):
        raise _unauthorized("Invalid bridge token")

    if auth_header is not None:
        scheme, separator, credentials = auth_header.strip().partition(" ")
        token = credentials.strip()
        if scheme.lower() != "bearer" or separator != " " or not token:
            raise _unauthorized("Invalid Authorization header")
        if _matches_shared_secret(token, sync_secret):
            return Actor(
                sub="moonwitness-sync",
                username="moonwitness-sync",
                role="service",
                issuer="shared-secret",
                authenticated=True,
            )
        try:
            return verify_es256_jwt(
                token,
                issuer_url=effective_settings.mid_issuer_url,
                ttl_seconds=effective_settings.mid_jwks_cache_ttl_seconds,
                expected_audience=effective_settings.mid_audience_allowlist,
            )
        except TokenVerificationError as exc:
            raise _unauthorized(str(exc)) from exc

    if bridge_header is not None:
        return Actor(
            sub="moonwitness-bridge",
            username="moonwitness-bridge",
            role="service",
            issuer="shared-secret",
            authenticated=True,
        )

    if effective_settings.memory_require_auth:
        raise _unauthorized("Authentication required")

    return None
