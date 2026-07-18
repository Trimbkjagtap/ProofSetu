"""Frozen-corpus retrieval (Member 3).

Deterministic keyword retrieval over the frozen 2026 LIHTC corpus. No live web
search, no general RAG. For a tiny frozen corpus, keyword scoring is reliable
and dependency-free (per handbook 14: "for a tiny corpus, simple keyword
retrieval may be faster"). RULE_INDEX=keyword is the default; a chroma/faiss
adapter can replace this later without changing the return shape.

The text model (if any) may only phrase an answer FROM the retrieved chunk.
If retrieval confidence is weak or the topic is absent, the caller abstains.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

_CORPUS_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "reference" / "lihtc_corpus_2026.json"
)

# Minimum overlap score required to treat a retrieval as grounded. Below this
# the caller abstains rather than answer weakly. Set to 2 so a single common
# word (e.g. "the") cannot ground an off-topic question.
_MIN_SCORE = 2

# Topic keyword hints improve matching for the narrow supported question set:
# annualization, required documents, verification recency, income comparison.
_TOPIC_HINTS = {
    "annualization": {"annualize", "annualized", "annual", "gross", "multiply", "income", "monthly"},
    "required_documents": {"document", "documents", "pay", "stub", "letter", "identity", "required"},
    "verification_recency": {"recent", "recency", "current", "days", "old", "expired", "date"},
    "income_limit_comparison": {"limit", "compare", "comparison", "threshold", "mtsp", "difference"},
}

_WORD_RE = re.compile(r"[a-z0-9]+")

# Common English stopwords are dropped before scoring so filler words like
# "the", "is", "what" cannot ground an off-topic question.
_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "am",
    "of", "to", "in", "on", "for", "and", "or", "but", "if", "then",
    "my", "me", "i", "you", "your", "it", "its", "this", "that", "these",
    "those", "do", "does", "did", "how", "what", "when", "where", "which",
    "who", "will", "would", "can", "could", "should", "with", "about",
    "at", "by", "from", "as", "so", "up", "out", "into",
}


def _tokenize(text):
    return {t for t in _WORD_RE.findall(text.lower()) if t not in _STOPWORDS}


def load_chunks():
    """Load the frozen corpus chunks."""
    with _CORPUS_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)["chunks"]


def retrieve(question, chunks=None):
    """Return the best-matching frozen chunk for a question, or None.

    Deterministic scoring: token overlap between the question and each chunk's
    text/topic/section, boosted by curated topic hints. Returns ``None`` when
    the best score is below ``_MIN_SCORE`` so the caller can abstain.
    """
    if not question or not str(question).strip():
        return None
    if chunks is None:
        chunks = load_chunks()

    q_tokens = _tokenize(question)
    best = None
    best_score = 0
    for chunk in chunks:
        chunk_tokens = _tokenize(
            f"{chunk['text']} {chunk['section']} {chunk['topic']}"
        )
        score = len(q_tokens & chunk_tokens)
        hints = _TOPIC_HINTS.get(chunk["topic"], set())
        score += len(q_tokens & hints)
        if score > best_score:
            best_score = score
            best = chunk

    if best is None or best_score < _MIN_SCORE:
        return None
    return best


def citation_for(chunk):
    """Build the contract ``citation`` object from a retrieved chunk."""
    return {
        "source": chunk["source"],
        "effectiveDate": chunk["effective_date"],
        "ruleYear": chunk["rule_year"],
        "section": chunk["section"],
    }
