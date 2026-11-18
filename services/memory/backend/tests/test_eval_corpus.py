import importlib.util
import json
from pathlib import Path
import sys
import unittest

EVAL_DIR = Path(__file__).resolve().parents[2] / "eval"
RUN_EVAL_PATH = EVAL_DIR / "run_eval.py"
CORPUS_PATH = EVAL_DIR / "corpus.json"


def _load_run_eval():
    spec = importlib.util.spec_from_file_location("run_eval", RUN_EVAL_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load evaluation runner from {RUN_EVAL_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules["run_eval"] = module
    spec.loader.exec_module(module)
    return module


run_eval = _load_run_eval()


class EvalCorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.corpus = run_eval.load_corpus(CORPUS_PATH)
        cls.valid_pairs = {
            (msg["archive_id"], msg["message_id"]) for msg in cls.corpus["messages"]
        }

    def test_corpus_meets_minimum_coverage_and_privacy_contract(self) -> None:
        self.assertEqual(self.corpus["version"], "1.0.0")
        self.assertGreaterEqual(len(self.corpus["messages"]), 12)
        self.assertGreaterEqual(len(self.corpus["queries"]), 8)

        categories = {q["category"] for q in self.corpus["queries"]}
        self.assertTrue(
            {"factual", "temporal", "ambiguous", "contradictory"}.issubset(categories)
        )
        self.assertTrue(any(q["expect_abstention"] for q in self.corpus["queries"]))

    def test_evaluation_is_deterministic_across_runs(self) -> None:
        first = run_eval.evaluate_corpus(CORPUS_PATH)
        second = run_eval.evaluate_corpus(CORPUS_PATH)

        for mode in ("fts", "vector", "hybrid"):
            m1 = first["measured_modes"][mode]
            m2 = second["measured_modes"][mode]
            self.assertEqual(m1["recall_at_3"], m2["recall_at_3"])
            self.assertEqual(m1["mrr"], m2["mrr"])
            self.assertEqual(m1["citation_exactness"], m2["citation_exactness"])
            self.assertEqual(m1["abstention_accuracy"], m2["abstention_accuracy"])
            self.assertEqual(
                [q["retrieved_citations"] for q in m1["per_query"]],
                [q["retrieved_citations"] for q in m2["per_query"]],
            )
        self.assertEqual(
            json.dumps(first, sort_keys=True),
            json.dumps(second, sort_keys=True),
        )

    def test_every_retrieved_hit_preserves_archive_and_message_ids(self) -> None:
        report = run_eval.evaluate_corpus(CORPUS_PATH)
        for mode in ("fts", "vector", "hybrid"):
            for query_record in report["measured_modes"][mode]["per_query"]:
                for hit in query_record["hits"]:
                    self.assertIn("archive_id", hit)
                    self.assertIn("message_id", hit)
                    self.assertTrue(hit["archive_id"])
                    self.assertTrue(hit["message_id"])
                    self.assertEqual(
                        hit["citation"],
                        f"{hit['archive_id']}:{hit['message_id']}",
                    )
                    self.assertIn((hit["archive_id"], hit["message_id"]), self.valid_pairs)

    def test_unanswerable_queries_trigger_abstention_without_citations(self) -> None:
        report = run_eval.evaluate_corpus(CORPUS_PATH)
        for mode in ("fts", "vector", "hybrid"):
            mode_report = report["measured_modes"][mode]
            self.assertEqual(mode_report["abstention_accuracy"], 1.0)
            abstention_rows = [
                row for row in mode_report["per_query"] if row["expect_abstention"]
            ]
            self.assertGreaterEqual(len(abstention_rows), 1)
            for row in abstention_rows:
                self.assertTrue(row["abstained"], msg=f"{mode} failed to abstain on {row['id']}")
                self.assertEqual(row["hits"], [])
                self.assertEqual(row["retrieved_citations"], [])


if __name__ == "__main__":
    unittest.main()
