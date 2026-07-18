"""Generate a SYNTHETIC pay-stub image for OCR/demo use.

All data is fictional. Never use real renter documents. Output is written to
data/synthetic/ (synthetic-only per the handbook).

Run from repo root (needs Pillow):
    python -m backend.extraction.tools.make_synthetic
"""
from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw, ImageFont

# label: (value) rendered as "Label: Value" on its own line. Layout mirrors what
# the mapper expects (label token followed by the value on the same line).
_PAY_STUB_LINES = [
    ("PAY STUB", ""),
    ("Employer", "Cambridge Community Services"),
    ("Employee", "Jordan Rivera"),
    ("Pay Period Start", "2026-04-01"),
    ("Pay Period End", "2026-04-15"),
    ("Pay Frequency", "Biweekly"),
    ("Gross Pay", "$2,450.00"),
]

# Government ID. Expiration is in the PAST so the checklist can show an expired
# demo ID. The ID number is fictional; only the last 4 are ever extracted/stored.
_GOVERNMENT_ID_LINES = [
    ("STATE IDENTIFICATION CARD", ""),
    ("Full Name", "Jordan Rivera"),
    ("Date of Birth", "1990-06-12"),
    ("ID Number", "A00047884821"),
    ("Expiration Date", "2024-02-10"),
]

_BENEFIT_LETTER_LINES = [
    ("BENEFIT AWARD LETTER", ""),
    ("Issuer", "State Benefits Office"),
    ("Recipient", "Jordan Rivera"),
    ("Benefit Type", "SNAP"),
    ("Monthly Amount", "$480.00"),
    ("Effective Date", "2026-01-01"),
]

_BANK_STATEMENT_LINES = [
    ("BANK STATEMENT", ""),
    ("Institution", "Riverbank Credit Union"),
    ("Account Holder", "Jordan Rivera"),
    ("Period Start", "2026-03-01"),
    ("Period End", "2026-03-31"),
    ("Ending Balance", "$1,875.00"),
]


def _font(size: int):
    for name in ("arial.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def generate(lines, out_path: pathlib.Path) -> pathlib.Path:
    width, height = 800, 500
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    title_font = _font(34)
    body_font = _font(24)

    y = 40
    for label, value in lines:
        if value == "":
            draw.text((60, y), label, fill="black", font=title_font)
            y += 70
            continue
        draw.text((60, y), f"{label}: {value}", fill="black", font=body_font)
        y += 55

    out_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(out_path)
    return out_path


def main() -> None:
    synthetic_dir = pathlib.Path(__file__).resolve().parents[3] / "data" / "synthetic"
    for lines, name in (
        (_PAY_STUB_LINES, "pay_stub_demo.png"),
        (_GOVERNMENT_ID_LINES, "government_id_demo.png"),
        (_BENEFIT_LETTER_LINES, "benefit_letter_demo.png"),
        (_BANK_STATEMENT_LINES, "bank_statement_demo.png"),
    ):
        path = generate(lines, synthetic_dir / name)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
