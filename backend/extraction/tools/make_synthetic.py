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
_LINES = [
    ("PAY STUB", ""),
    ("Employer", "Cambridge Community Services"),
    ("Employee", "Jordan Rivera"),
    ("Pay Period Start", "2026-04-01"),
    ("Pay Period End", "2026-04-15"),
    ("Pay Frequency", "Biweekly"),
    ("Gross Pay", "$2,450.00"),
]


def _font(size: int):
    for name in ("arial.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def generate(out_path: pathlib.Path) -> pathlib.Path:
    width, height = 800, 500
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    title_font = _font(34)
    body_font = _font(24)

    y = 40
    for label, value in _LINES:
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
    repo_root = pathlib.Path(__file__).resolve().parents[3]
    out = repo_root / "data" / "synthetic" / "pay_stub_demo.png"
    path = generate(out)
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
