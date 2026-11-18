import ast
import hashlib
import json
from pathlib import Path
import sqlite3
import unittest

from app.witness_ledger import (
    EPISTEMIC_TYPES,
    RELATION_TYPES,
    add_claim_source,
    create_claim,
    export_witness_ledger,
    init_witness_ledger,
    link_claims,
    revise_claim,
    trace_claim_provenance,
)


def _create_archive_tables(db: sqlite3.Connection) -> None:
    """Create minimal archives/messages tables matching app/db.py for provenance tests."""
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS archives (
            id TEXT PRIMARY KEY,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            sha256 TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'queued',
            drive_status TEXT NOT NULL DEFAULT 'pending',
            drive_key TEXT,
            drive_error TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            message_id TEXT NOT NULL,
            archive_id TEXT NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
            conversation_id TEXT NOT NULL,
            conversation_title TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT,
            PRIMARY KEY (archive_id, message_id)
        );
        """
    )


class WitnessLedgerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        _create_archive_tables(self.db)
        init_witness_ledger(self.db)

        self.archive_id = "arch-test-01"
        self.db.execute(
            """
            INSERT INTO archives (id, file_name, file_path, size_bytes, sha256, status, created_at)
            VALUES (?, 'synthetic.zip', '/tmp/synthetic.zip', 512, ?, 'complete', '2026-10-01T00:00:00Z')
            """,
            (self.archive_id, "a" * 64),
        )
        self.message_text = (
            "Auth v2 replaces X-Bridge-Secret with MoonWitness ID OIDC Bearer JWTs "
            "verified against cached JWKS keys."
        )
        self.db.execute(
            """
            INSERT INTO messages (
                message_id, archive_id, conversation_id, conversation_title, role, content, created_at
            ) VALUES (?, ?, 'conv-auth', 'Auth Transition', 'assistant', ?, '2026-10-18T14:30:00Z')
            """,
            ("msg-auth-v2", self.archive_id, self.message_text),
        )

    def tearDown(self) -> None:
        self.db.close()

    def test_all_seven_epistemic_types_and_validation(self) -> None:
        self.assertEqual(
            EPISTEMIC_TYPES,
            ("fact", "testimony", "hypothesis", "interpretation", "dream", "fiction", "unknown"),
        )
        for epistemic_type in EPISTEMIC_TYPES:
            created = create_claim(
                self.db,
                statement=f"Synthetic {epistemic_type} statement",
                epistemic_type=epistemic_type,
                source={
                    "archive_id": self.archive_id,
                    "message_id": "msg-auth-v2",
                    "excerpt": "MoonWitness ID OIDC Bearer JWTs",
                    "attribution": "synthetic-reviewer",
                    "rationale": f"Classified explicitly as {epistemic_type}",
                },
            )
            self.assertEqual(created["epistemic_type"], epistemic_type)
            expected_status = "unverified" if epistemic_type == "unknown" else "active"
            self.assertEqual(created["status"], expected_status)

        with self.assertRaises(ValueError):
            create_claim(
                self.db,
                statement="Bad epistemic category",
                epistemic_type="rumor",
            )

    def test_unsupported_claims_remain_unverified(self) -> None:
        claim = create_claim(
            self.db,
            statement="Unverified assertion without source passage",
            epistemic_type="fact",
            source=None,
        )
        self.assertEqual(claim["status"], "unverified")
        self.assertEqual(claim["sources"], [])

        with self.assertRaises(ValueError):
            create_claim(
                self.db,
                statement="Cannot promote unsourced claim directly to active",
                epistemic_type="fact",
                source=None,
                status="active",
            )

    def test_revise_claim_preserves_history_and_original_sources(self) -> None:
        excerpt = "MoonWitness ID OIDC Bearer JWTs"
        expected_msg_sha = hashlib.sha256(self.message_text.encode("utf-8")).hexdigest()

        claim = create_claim(
            self.db,
            statement="Auth uses OIDC Bearer tokens",
            epistemic_type="interpretation",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-auth-v2",
                "excerpt": excerpt,
                "attribution": "archivist",
                "rationale": "Initial summary",
            },
            valid_from="2026-10-18T14:30:00Z",
        )
        original_source = claim["sources"][0]
        self.assertEqual(original_source["source_sha256"], expected_msg_sha)

        rev1 = revise_claim(
            self.db,
            claim["id"],
            new_statement="Auth v2 uses MoonWitness ID OIDC Bearer JWTs with cached JWKS",
            new_epistemic_type="fact",
            reason="Verified directly against architecture record",
        )
        self.assertEqual(rev1["epistemic_type"], "fact")
        self.assertEqual(rev1["revision"]["revision_no"], 1)

        rev2 = revise_claim(
            self.db,
            claim["id"],
            new_statement="Auth v2 replaces X-Bridge-Secret using OIDC Bearer JWTs and JWKS cache",
            reason="Clarified superseded v1 mechanism",
        )
        self.assertEqual(rev2["revision"]["revision_no"], 2)

        provenance = trace_claim_provenance(self.db, claim["id"])
        assert provenance is not None
        self.assertEqual(len(provenance["revisions"]), 2)
        self.assertEqual(provenance["revisions"][0]["previous_statement"], "Auth uses OIDC Bearer tokens")
        self.assertEqual(provenance["revisions"][0]["previous_epistemic_type"], "interpretation")
        self.assertEqual(provenance["revisions"][0]["new_epistemic_type"], "fact")
        self.assertEqual(provenance["revisions"][1]["revision_no"], 2)

        # Original source hash, excerpt, and archive message remain completely unmodified.
        self.assertEqual(len(provenance["sources"]), 1)
        self.assertEqual(provenance["sources"][0]["source_sha256"], expected_msg_sha)
        self.assertEqual(provenance["sources"][0]["excerpt"], excerpt)
        self.assertEqual(provenance["resolved_messages"][0]["content"], self.message_text)

    def test_contradicts_and_derived_from_keep_competing_claims_visible(self) -> None:
        self.assertEqual(
            RELATION_TYPES, ("supports", "contradicts", "derived_from", "supersedes")
        )
        self.db.execute(
            """
            INSERT INTO messages (
                message_id, archive_id, conversation_id, conversation_title, role, content, created_at
            ) VALUES ('msg-sync-a', ?, 'conv-sync-a', 'Sync Draft', 'user', 'Allow blank token locally', '2026-10-05T13:00:00Z')
            """,
            (self.archive_id,),
        )
        self.db.execute(
            """
            INSERT INTO messages (
                message_id, archive_id, conversation_id, conversation_title, role, content, created_at
            ) VALUES ('msg-sync-b', ?, 'conv-sync-b', 'Security Audit', 'assistant', 'Fail closed without token', '2026-10-25T15:10:00Z')
            """,
            (self.archive_id,),
        )

        claim_a = create_claim(
            self.db,
            statement="Webhook sync falls back to unauthenticated POST if token is empty",
            epistemic_type="testimony",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-sync-a",
                "excerpt": "Allow blank token locally",
            },
        )
        claim_b = create_claim(
            self.db,
            statement="Webhook sync must fail closed with RuntimeError when token is empty",
            epistemic_type="fact",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-sync-b",
                "excerpt": "Fail closed without token",
            },
        )
        claim_derived = create_claim(
            self.db,
            statement="Operational runbook requires configuring MOONWITNESS_SYNC_TOKEN before enabling webhook sync",
            epistemic_type="hypothesis",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-sync-b",
                "excerpt": "Fail closed without token",
            },
        )

        rel_contra = link_claims(
            self.db,
            claim_b["id"],
            claim_a["id"],
            "contradicts",
            note="Security audit prohibits unauthenticated fallback from earlier sprint note",
        )
        rel_derived = link_claims(
            self.db,
            claim_derived["id"],
            claim_b["id"],
            "derived_from",
            note="Runbook requirement derived from security audit claim",
        )
        self.assertEqual(rel_contra["relation_type"], "contradicts")
        self.assertEqual(rel_derived["relation_type"], "derived_from")

        prov_a = trace_claim_provenance(self.db, claim_a["id"])
        prov_b = trace_claim_provenance(self.db, claim_b["id"])
        assert prov_a is not None and prov_b is not None

        # Neither competing claim is deleted or hidden; both reflect disputed status.
        self.assertEqual(prov_a["claim"]["status"], "disputed")
        self.assertEqual(prov_b["claim"]["status"], "disputed")
        self.assertEqual(prov_a["relations"][0]["related_claim"]["id"], claim_b["id"])
        self.assertEqual(prov_b["relations"][0]["related_claim"]["id"], claim_a["id"])
        self.assertEqual(prov_b["relations"][1]["relation_type"], "derived_from")

        exported = export_witness_ledger(self.db)
        exported_ids = {row["id"] for row in exported["claims"]}
        self.assertEqual(exported_ids, {claim_a["id"], claim_b["id"], claim_derived["id"]})

    def test_full_provenance_traversal_and_json_export(self) -> None:
        excerpt = "MoonWitness ID OIDC Bearer JWTs"
        claim = create_claim(
            self.db,
            statement="OIDC Bearer JWTs replaced X-Bridge-Secret",
            epistemic_type="fact",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-auth-v2",
                "excerpt": excerpt,
                "attribution": "assistant",
                "rationale": "Direct quote from Auth Transition",
            },
            valid_from="2026-10-18T14:30:00Z",
        )
        add_claim_source(
            self.db,
            claim["id"],
            {
                "archive_id": self.archive_id,
                "message_id": "msg-auth-v2",
                "excerpt": "cached JWKS keys",
                "attribution": "assistant",
                "rationale": "JWKS verification mechanism",
            },
        )

        provenance = trace_claim_provenance(self.db, claim["id"])
        assert provenance is not None
        self.assertEqual(len(provenance["sources"]), 2)
        first_src = provenance["sources"][0]
        start = first_src["offset_start"]
        end = first_src["offset_end"]
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)
        self.assertEqual(
            first_src["original_message"]["content"][start:end],
            excerpt,
        )
        self.assertEqual(provenance["resolved_messages"][0]["archive_id"], self.archive_id)
        self.assertEqual(provenance["resolved_messages"][0]["message_id"], "msg-auth-v2")

        # Export must be strictly JSON-serializable and preserve all 4 tables.
        exported = export_witness_ledger(self.db)
        roundtrip = json.loads(json.dumps(exported))
        self.assertEqual(roundtrip["schema_version"], 1)
        self.assertEqual(len(roundtrip["claims"]), 1)
        self.assertEqual(len(roundtrip["sources"]), 2)
        self.assertEqual(roundtrip["revisions"], [])
        self.assertEqual(roundtrip["relations"], [])
        self.assertIsNone(trace_claim_provenance(self.db, "nonexistent-claim-id"))

    def test_supersedes_marks_prior_claim_superseded_without_hiding(self) -> None:
        old_claim = create_claim(
            self.db,
            statement="Auth v1 uses static X-Bridge-Secret header",
            epistemic_type="fact",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-auth-v2",
                "excerpt": "X-Bridge-Secret",
            },
            valid_from="2026-09-10T09:00:00Z",
        )
        new_claim = create_claim(
            self.db,
            statement="Auth v2 uses MoonWitness ID OIDC Bearer JWTs",
            epistemic_type="fact",
            source={
                "archive_id": self.archive_id,
                "message_id": "msg-auth-v2",
                "excerpt": "MoonWitness ID OIDC Bearer JWTs",
            },
            valid_from="2026-10-18T14:30:00Z",
        )
        rel = link_claims(
            self.db,
            new_claim["id"],
            old_claim["id"],
            "supersedes",
            note="v2 OIDC replaces v1 shared secret",
        )
        self.assertEqual(rel["relation_type"], "supersedes")

        old_prov = trace_claim_provenance(self.db, old_claim["id"])
        assert old_prov is not None
        self.assertEqual(old_prov["claim"]["status"], "superseded")
        self.assertIsNotNone(old_prov["claim"]["valid_until"])
        self.assertEqual(old_prov["relations"][0]["direction"], "incoming")

    def test_db_init_db_wires_init_witness_ledger(self) -> None:
        db_py = Path(__file__).resolve().parents[1] / "app" / "db.py"
        tree = ast.parse(db_py.read_text(encoding="utf-8"))
        init_fn = next(
            node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "init_db"
        )
        calls = [
            node.func.id
            for node in ast.walk(init_fn)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
        ]
        self.assertIn("init_witness_ledger", calls)


if __name__ == "__main__":
    unittest.main()
