"""
Dump all section headers and article headers detected in the docx.
Run from antardrishti-magazine/: python scripts/dump_headers.py
"""
import re
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn

DOCX_PATH = Path("../Antardrishti 2nd Edition.docx")

def all_body_paragraphs(doc):
    result = []
    def walk(element):
        for child in element:
            if child.tag == qn("w:p"):
                result.append(child)
            else:
                walk(child)
    walk(doc.element.body)
    return result

def para_text(p_el):
    return "".join(t.text or "" for t in p_el.iter(qn("w:t"))).strip()

def main():
    doc = Document(DOCX_PATH)
    paragraphs = all_body_paragraphs(doc)

    print(f"Total paragraphs: {len(paragraphs)}\n")
    print("=== Section & Article Headers ===")
    for i, p_el in enumerate(paragraphs):
        text = para_text(p_el)
        if not text:
            continue
        # Section: starts with a digit, space, then uppercase
        if re.match(r"^\d+\s+[A-Z]", text) and not re.match(r"^\d+\.\d+", text):
            print(f"[SECTION] para[{i}]: {repr(text[:80])}")
        # Article: N.M Title
        elif re.match(r"^\d+\.\d+\s+", text):
            print(f"[ARTICLE] para[{i}]: {repr(text[:80])}")

if __name__ == "__main__":
    main()
