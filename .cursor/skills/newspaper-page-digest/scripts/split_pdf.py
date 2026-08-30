#!/usr/bin/env python3
"""
Split a combined newspaper PDF into one PDF per page.

Usage:
    python split_pdf.py <input.pdf> <output_dir>

Prints a JSON report to stdout:
    {"total_pages": N, "pages": [{"page": 1, "path": "<output_dir>/page-01.pdf"}, ...]}

This is the "fit all pages" step: it gives every downstream sub-agent a
single-page PDF to work from, so page boundaries can never bleed into each
other and each sub-agent's job is unambiguous.
"""
import sys
import os
import json

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print("pypdf not installed. Install it with: pip install pypdf --break-system-packages", file=sys.stderr)
    sys.exit(1)


def split_pdf(input_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    reader = PdfReader(input_path)
    total_pages = len(reader.pages)
    pages = []

    width = len(str(total_pages))
    for i in range(total_pages):
        writer = PdfWriter()
        writer.add_page(reader.pages[i])
        page_num = i + 1
        out_name = f"page-{str(page_num).zfill(max(2, width))}.pdf"
        out_path = os.path.join(output_dir, out_name)
        with open(out_path, "wb") as f:
            writer.write(f)
        pages.append({"page": page_num, "path": out_path})

    return {"total_pages": total_pages, "pages": pages}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python split_pdf.py <input.pdf> <output_dir>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.isfile(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    result = split_pdf(input_path, output_dir)
    print(json.dumps(result, indent=2))
