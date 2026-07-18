"""Make the repo root importable so tests can `from backend.extraction... import`.

pytest auto-loads conftest.py from parent dirs before collection, so this runs
regardless of the working directory CI uses.
"""
import pathlib
import sys

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
