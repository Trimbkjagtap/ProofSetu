"""Member 3 gold tests for backend/rules.

Run without pytest:  python3 -m unittest tests.test_rules -v
Run with pytest:      pytest -q tests/test_rules.py

Covers handbook 9.5:
- each demo pay frequency
- household-size threshold lookup
- missing household size -> abstention (not a guessed threshold)
- exact source/effective-date metadata
- forbidden verdict tokens absent
Plus the frozen gold case matching contracts/rules-response.json.
"""

import json
import sys
import unittest
from pathlib import Path

# Make repo root importable so `backend.rules...` resolves when run directly.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.rules import calculations as calc
from backend.rules import retrieval
from backend.rules import service


class TestAnnualization(unittest.TestCase):
    def test_monthly_gold_case(self):
        self.assertEqual(calc.annualize_income(2650, "monthly"), 31800)

    def test_all_demo_frequencies(self):
        self.assertEqual(calc.annualize_income(1000, "weekly"), 52000)
        self.assertEqual(calc.annualize_income(1000, "biweekly"), 26000)
        self.assertEqual(calc.annualize_income(1000, "semimonthly"), 24000)
        self.assertEqual(calc.annualize_income(1000, "monthly"), 12000)
        self.assertEqual(calc.annualize_income(50000, "annual"), 50000)

    def test_unknown_frequency_abstains(self):
        with self.assertRaises(calc.AbstainError):
            calc.annualize_income(1000, "fortnightly")

    def test_missing_amount_abstains(self):
        with self.assertRaises(calc.AbstainError):
            calc.annualize_income(None, "monthly")


class TestThresholdLookup(unittest.TestCase):
    def test_gold_threshold(self):
        self.assertEqual(
            calc.lookup_mtsp_limit("cambridge_boston", 1, 50, 2026), 46700
        )

    def test_household_size_changes_threshold(self):
        one = calc.lookup_mtsp_limit("cambridge_boston", 1, 50)
        four = calc.lookup_mtsp_limit("cambridge_boston", 4, 50)
        self.assertNotEqual(one, four)
        self.assertGreater(four, one)

    def test_missing_household_size_abstains(self):
        with self.assertRaises(calc.AbstainError):
            calc.lookup_mtsp_limit("cambridge_boston", None, 50)

    def test_unknown_metro_abstains(self):
        with self.assertRaises(calc.AbstainError):
            calc.lookup_mtsp_limit("nowhere", 1, 50)

    def test_wrong_year_abstains(self):
        with self.assertRaises(calc.AbstainError):
            calc.lookup_mtsp_limit("cambridge_boston", 1, 50, 2025)


class TestCompareFacts(unittest.TestCase):
    def test_gold_difference(self):
        facts = calc.compare_facts(31800, 46700)
        self.assertEqual(facts, {"counted": 31800, "threshold": 46700, "difference": 14900})

    def test_no_verdict_keys(self):
        facts = calc.compare_facts(50000, 46700)
        self.assertNotIn("eligible", facts)
        self.assertNotIn("status", facts)
        self.assertEqual(facts["difference"], -3300)


class TestRetrieval(unittest.TestCase):
    def test_annualization_question_grounds(self):
        chunk = retrieval.retrieve("How is my monthly income annualized?")
        self.assertIsNotNone(chunk)
        self.assertEqual(chunk["topic"], "annualization")

    def test_offtopic_question_abstains(self):
        self.assertIsNone(retrieval.retrieve("What is the weather tomorrow?"))

    def test_empty_question_abstains(self):
        self.assertIsNone(retrieval.retrieve(""))

    def test_citation_metadata_exact(self):
        chunk = retrieval.retrieve("annualize income")
        cite = retrieval.citation_for(chunk)
        self.assertEqual(cite["source"], "2026 LIHTC Program Rule Corpus")
        self.assertEqual(cite["effectiveDate"], "2026-05-01")
        self.assertEqual(cite["ruleYear"], 2026)
        self.assertIn("section", cite)


class TestService(unittest.TestCase):
    def test_gold_response_matches_contract_shape(self):
        result = service.answer_rule_query(
            question="How is my monthly income annualized?",
            confirmed_income={"amount": 2650, "frequency": "monthly"},
            metro="cambridge_boston",
            household_size=1,
            ami_pct=50,
        )
        self.assertFalse(result["abstained"])
        self.assertEqual(result["calculation"]["confirmedValue"], 2650)
        self.assertEqual(result["calculation"]["annualizedIncome"], 31800)
        self.assertEqual(result["calculation"]["threshold"], 46700)
        self.assertEqual(result["calculation"]["difference"], 14900)
        self.assertEqual(result["calculation"]["formula"], "$2,650 x 12")
        self.assertEqual(result["citation"]["ruleYear"], 2026)
        self.assertEqual(result["disclaimer"], "This comparison does not determine eligibility.")
        # Exact contract key set.
        self.assertEqual(
            set(result.keys()),
            {"answer", "calculation", "citation", "abstained", "disclaimer"},
        )
        self.assertEqual(
            set(result["calculation"].keys()),
            {"confirmedValue", "formula", "annualizedIncome", "threshold", "difference"},
        )

    def test_missing_household_size_abstains(self):
        result = service.answer_rule_query(
            question="How is my monthly income annualized?",
            confirmed_income={"amount": 2650, "frequency": "monthly"},
            metro="cambridge_boston",
            household_size=None,
        )
        self.assertTrue(result["abstained"])
        self.assertIsNone(result["calculation"])

    def test_offtopic_abstains(self):
        result = service.answer_rule_query(question="Will it rain tomorrow?")
        self.assertTrue(result["abstained"])

    def test_no_forbidden_tokens_in_answer(self):
        result = service.answer_rule_query(
            question="How is my monthly income annualized?",
            confirmed_income={"amount": 2650, "frequency": "monthly"},
            metro="cambridge_boston",
            household_size=1,
        )
        # Should not raise.
        service.assert_no_verdict(result["answer"])

    def test_output_guard_blocks_verdict(self):
        with self.assertRaises(ValueError):
            service.assert_no_verdict("You are eligible for this program.")
        with self.assertRaises(ValueError):
            service.assert_no_verdict("Application approved.")

    def test_over_threshold_still_no_verdict(self):
        result = service.answer_rule_query(
            question="Compare my income to the limit.",
            confirmed_income={"amount": 5000, "frequency": "monthly"},
            metro="cambridge_boston",
            household_size=1,
        )
        # 5000 * 12 = 60000 > 46700 -> negative difference, but NO verdict word.
        self.assertFalse(result["abstained"])
        self.assertEqual(result["calculation"]["difference"], 46700 - 60000)
        service.assert_no_verdict(result["answer"])


class TestFixtureMatchesGold(unittest.TestCase):
    def test_fixture_file_matches_service_output(self):
        fixture_path = ROOT / "backend" / "rules" / "fixtures" / "rules-response.example.json"
        with fixture_path.open(encoding="utf-8") as fh:
            fixture = json.load(fh)
        result = service.answer_rule_query(
            question="How is my monthly income annualized?",
            confirmed_income={"amount": 2650, "frequency": "monthly"},
            metro="cambridge_boston",
            household_size=1,
        )
        self.assertEqual(fixture["calculation"], result["calculation"])
        self.assertEqual(fixture["citation"], result["citation"])
        self.assertEqual(fixture["abstained"], result["abstained"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
