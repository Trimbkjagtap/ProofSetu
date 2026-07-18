"""Render a packet to accessible HTML and to PDF (pure-Python fpdf2).

HTML is always available (the accessible preview + fallback if the PDF library
fails, per the handbook fallback matrix). PDF is generated with fpdf2 — no native
system dependencies, so it deploys anywhere (Render free tier included).
"""
from __future__ import annotations

from html import escape
from typing import List, Tuple

TITLE = "RealDoor — Application Readiness Packet"
NOTICE = (
    "This packet is renter-controlled. It contains only information you confirmed. "
    "It does not determine eligibility; a qualified housing professional makes the "
    "final decision."
)


def _rows(fields: List[dict]) -> List[Tuple[str, str]]:
    return [(str(f.get("name", "")), str(f.get("value", ""))) for f in fields]


def render_html(packet: dict) -> str:
    fields = packet.get("fields", [])
    docs = packet.get("includedDocuments", [])
    field_rows = "".join(
        f"<tr><th scope='row'>{escape(name)}</th><td>{escape(value)}</td></tr>"
        for name, value in _rows(fields)
    ) or "<tr><td colspan='2'>No confirmed fields.</td></tr>"
    doc_items = "".join(f"<li>{escape(str(d))}</li>" for d in docs) or "<li>None selected.</li>"
    return (
        "<!doctype html>\n"
        '<html lang="en"><head><meta charset="utf-8">'
        f"<title>{escape(TITLE)}</title></head><body>"
        f"<h1>{escape(TITLE)}</h1>"
        f"<p>{escape(NOTICE)}</p>"
        "<h2>Confirmed information</h2>"
        f"<table><tbody>{field_rows}</tbody></table>"
        "<h2>Included documents</h2>"
        f"<ul>{doc_items}</ul>"
        "</body></html>"
    )


def _latin1(text: str) -> str:
    # Core PDF fonts are latin-1; replace anything outside it rather than crash.
    return str(text).encode("latin-1", "replace").decode("latin-1")


def render_pdf(packet: dict) -> bytes:
    from fpdf import FPDF  # local imports so the app still boots if fpdf is absent
    from fpdf.enums import XPos, YPos

    fields = packet.get("fields", [])
    docs = packet.get("includedDocuments", [])

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    def line(height: float, text: str) -> None:
        # new_x=LMARGIN returns the cursor to the left margin (fpdf2 defaults to
        # the right edge, which leaves no room for the next full-width line).
        pdf.multi_cell(0, height, _latin1(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "B", 16)
    line(10, TITLE)
    pdf.set_font("Helvetica", "", 9)
    line(5, NOTICE)
    pdf.ln(3)

    pdf.set_font("Helvetica", "B", 12)
    line(8, "Confirmed information")
    pdf.set_font("Helvetica", "", 11)
    if fields:
        for name, value in _rows(fields):
            line(7, f"- {name}: {value}")
    else:
        line(7, "No confirmed fields.")
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 12)
    line(8, "Included documents")
    pdf.set_font("Helvetica", "", 11)
    if docs:
        for doc in docs:
            line(7, f"- {doc}")
    else:
        line(7, "None selected.")

    return bytes(pdf.output())
