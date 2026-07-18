"""Rules service (Member 3).

Assembles the POST /rules/query response EXACTLY matching
contracts/rules-response.json. Grounds every answer in a retrieved frozen
chunk, runs deterministic math, cites source + effective date + rule year, and
abstains when it cannot ground or an input is missing.

A local output guard strips/blocks forbidden verdict language as defence in
depth; Member 4's global output guard is the authoritative gate.
"""

from __future__ import annotations

import re

from . import calculations as calc
from . import retrieval

DISCLAIMER = "This comparison does not determine eligibility."

# Forbidden verdict/score/rank tokens (contracts/README "Forbidden output
# language"). The rules layer must never emit these as a judgment about the
# renter. Matched on whole words only.
FORBIDDEN_TOKENS = (
    "eligible",
    "ineligible",
    "approved",
    "denied",
    "disqualified",
    "likelihood",
    "recommend",
    "recommendation",
    "ranking",
    "rank",
)

# Safe collocations that must NOT trip the guard. "A qualified human decides"
# is the mandated refusal language, so "qualified" is only forbidden when it is
# NOT part of these phrases. Keep this list tight and explicit.
_ALLOWED_PHRASES = (
    "qualified human",
    "qualified housing professional",
    "qualified professional",
)


def assert_no_verdict(text):
    """Raise ValueError if text contains a forbidden verdict token.

    Whole-word matching only. Neutralizes the mandated safe phrases (e.g.
    "a qualified human decides") before checking, so allowed language passes.
    """
    lowered = str(text).lower()
    for phrase in _ALLOWED_PHRASES:
        lowered = lowered.replace(phrase, " ")

    for token in FORBIDDEN_TOKENS:
        if re.search(rf"\b{re.escape(token)}\b", lowered):
            raise ValueError(f"forbidden verdict token in output: {token!r}")

    # "qualified"/"pass"/"fail" only forbidden as standalone verdicts; allow the
    # neutralized safe phrases above but still block a bare "qualified".
    for token in ("qualified", "pass", "fail"):
        if re.search(rf"\b{re.escape(token)}\b", lowered):
            raise ValueError(f"forbidden verdict token in output: {token!r}")


def abstain(reason):
    """Return a contract-shaped abstained response."""
    return {
        "answer": "RealDoor cannot answer this from the frozen 2026 rules. "
        "It only answers narrow, cited questions about annualization, required "
        "documents, verification recency, and income-limit comparison.",
        "calculation": None,
        "citation": None,
        "abstained": True,
        "disclaimer": DISCLAIMER,
        "_reason": reason,
    }


def answer_rule_query(
    question,
    confirmed_income=None,
    metro=None,
    household_size=None,
    ami_pct=50,
    year=2026,
):
    """Return the exact rules-response contract for a rule question.

    ``confirmed_income`` is ``{"amount", "frequency"}`` (renter-confirmed).
    When income + household size are present, deterministic math is attached.
    Abstains (abstained=true) on weak retrieval or missing inputs.
    """
    chunk = retrieval.retrieve(question)
    if chunk is None:
        return abstain("no grounded chunk for question")

    citation = retrieval.citation_for(chunk)

    calculation = None
    # Only compute math for the annualization/comparison topics and only when
    # we actually have the confirmed inputs. Otherwise return the cited
    # explanation without inventing numbers.
    if chunk["topic"] in ("annualization", "income_limit_comparison") and confirmed_income:
        try:
            amount = confirmed_income.get("amount")
            frequency = confirmed_income.get("frequency")
            annualized = calc.annualize_income(amount, frequency)
            formula = calc.format_formula(amount, frequency)
            threshold = calc.lookup_mtsp_limit(metro, household_size, ami_pct, year)
            facts = calc.compare_facts(annualized, threshold)
            calculation = {
                "confirmedValue": int(round(float(amount))),
                "formula": formula,
                "annualizedIncome": annualized,
                "threshold": facts["threshold"],
                "difference": facts["difference"],
            }
        except calc.AbstainError as exc:
            # Missing/unknown input -> abstain rather than guess a threshold.
            return abstain(str(exc))

    answer = _phrase_answer(chunk, calculation)
    assert_no_verdict(answer)

    return {
        "answer": answer,
        "calculation": calculation,
        "citation": citation,
        "abstained": False,
        "disclaimer": DISCLAIMER,
    }


def _phrase_answer(chunk, calculation):
    """Phrase a grounded answer strictly from the retrieved chunk text.

    Deterministic today (no model). A model may later rephrase, but ONLY from
    chunk['text']; the output must still pass assert_no_verdict.
    """
    base = chunk["text"]
    if calculation is not None:
        base = (
            f"{base} For the confirmed value, "
            f"{calculation['formula']} = ${calculation['annualizedIncome']:,} counted "
            f"annual income, compared to the ${calculation['threshold']:,} limit "
            f"(difference ${calculation['difference']:,})."
        )
    return base
