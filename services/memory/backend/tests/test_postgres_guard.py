import sqlite3

import pytest
from app.db import (
    POSTGRES_SCHEMA_STATEMENTS,
    export_sqlite_reconciliation_counts,
    get_postgres_schema_sql,
    validate_private_postgres_url,
)


@pytest.mark.parametrize(
    "url,expected",
    [
        ("postgres://localhost/memory", "postgres://localhost/memory"),
        ("postgresql://localhost:5432/memory", "postgresql://localhost:5432/memory"),
        (
            "postgresql://memory_user:secret@127.0.0.1:5432/memory",
            "postgresql://memory_user:secret@127.0.0.1:5432/memory",
        ),
        ("postgres://[::1]:5432/memory", "postgres://[::1]:5432/memory"),
        (
            "  POSTGRESQL://LOCALHOST:5432/moonwitness_memory  ",
            "POSTGRESQL://LOCALHOST:5432/moonwitness_memory",
        ),
    ],
)
def test_validate_private_postgres_url_accepts_loopback(url: str, expected: str) -> None:
    assert validate_private_postgres_url(url) == expected


@pytest.mark.parametrize(
    "url",
    [
        "postgresql://db.moonwitness.biz.id:5432/moonwitness",
        "postgres://10.0.0.12:5432/memory",
        "postgresql://192.168.1.25:5432/memory",
        "postgresql://0.0.0.0:5432/memory",
        "postgresql://127.0.0.2:5432/memory",
        "postgresql://localhost@vps.example.com:5432/memory",
        "postgresql://127.0.0.1.attacker.example:5432/memory",
        "postgresql:///memory",
    ],
)
def test_validate_private_postgres_url_rejects_remote_or_empty_hosts(url: str) -> None:
    with pytest.raises(ValueError, match="non-loopback"):
        validate_private_postgres_url(url)


@pytest.mark.parametrize(
    "url",
    [
        "",
        "   ",
        "sqlite:///data/db/memory.sqlite3",
        "http://127.0.0.1:5432/memory",
        "mysql://localhost:3306/memory",
        "postgresql+psycopg://127.0.0.1:5432/memory",
        "postgresql://localhost:notaport/memory",
    ],
)
def test_validate_private_postgres_url_rejects_non_postgres_or_malformed(url: str) -> None:
    with pytest.raises(ValueError):
        validate_private_postgres_url(url)


def test_postgres_schema_defines_pgvector_and_metadata_tables() -> None:
    assert len(POSTGRES_SCHEMA_STATEMENTS) >= 4
    ddl = get_postgres_schema_sql()
    assert "CREATE EXTENSION IF NOT EXISTS vector;" in ddl
    assert "CREATE TABLE IF NOT EXISTS archives" in ddl
    assert "file_path TEXT NOT NULL" in ddl
    assert "CREATE TABLE IF NOT EXISTS chunks" in ddl
    assert "embedding vector(" in ddl
    assert "CREATE TABLE IF NOT EXISTS entities" in ddl


def test_export_sqlite_reconciliation_counts_non_destructive() -> None:
    conn = sqlite3.connect(":memory:")
    conn.executescript(
        """
        CREATE TABLE archives (id TEXT PRIMARY KEY);
        CREATE TABLE jobs (id TEXT PRIMARY KEY);
        INSERT INTO archives (id) VALUES ('arch-1'), ('arch-2');
        INSERT INTO jobs (id) VALUES ('job-1');
        """
    )
    counts = export_sqlite_reconciliation_counts(conn)
    assert counts["archives"] == 2
    assert counts["jobs"] == 1
    assert counts["chunks"] == 0
    assert counts["entities"] == 0
    conn.close()
