"""
debug_images.py
Dumps which image rIds appear in each article's paragraph range,
and whether different articles share the same rId or image bytes.
Run from antardrishti-magazine/:  python scripts/debug_images.py
"""

import re, io, hashlib
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn

DOCX_PATH = Path("../Antardrishti 2nd Edition.docx")

_VML_IMAGEDATA = "{urn:schemas-microsoft-com:vml}imagedata"
_R_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

DOCX_SECTION_MAP = {
    1: (4, "section-4", 3),
    2: (3, "section-3", 4),
    3: (2, "section-2", 3),
    4: (5, "section-5", 3),
    5: (6, "section-6", 4),
}

def extract_all_images(doc):
    images = {}
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                data = rel.target_part.blob
                images[rel.rId] = {"bytes": data, "hash": hashlib.md5(data).hexdigest(), "size": len(data)}
            except Exception:
                pass
    return images

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

def para_image_rids(p_el):
    rids = []
    for blip in p_el.iter(qn("a:blip")):
        rid = blip.get(qn("r:embed"))
        if rid and rid not in rids:
            rids.append(rid)
    for imgd in p_el.iter(_VML_IMAGEDATA):
        rid = imgd.get(_R_ID)
        if rid and rid not in rids:
            rids.append(rid)
    return rids

def is_section_header(text):
    m = re.match(r"^(\d+)\s+[A-Z'''\"]", text)
    if m and not re.match(r"^\d+\.\d+", text):
        return int(m.group(1))
    return None

def is_article_header(text):
    m = re.match(r"^(\d+)\.(\d+)\s+(.+)", text)
    if m:
        return int(m.group(1)), int(m.group(2)), m.group(3).strip()
    return None

def main():
    doc = Document(DOCX_PATH)
    all_imgs = extract_all_images(doc)
    paragraphs = all_body_paragraphs(doc)
    n = len(paragraphs)

    print(f"Embedded images: {len(all_imgs)}")
    print(f"Total paragraphs: {n}\n")

    # Print MD5 hash for every image to detect duplicates
    hash_to_rids = {}
    for rid, info in all_imgs.items():
        h = info["hash"]
        hash_to_rids.setdefault(h, []).append(rid)

    print("=== Duplicate image content detection ===")
    for h, rids in hash_to_rids.items():
        if len(rids) > 1:
            print(f"  Hash {h[:8]}... shared by rIds: {rids}  (size: {all_imgs[rids[0]]['size']} bytes)")
    print()

    # Find boundaries
    boundaries = []
    current_docx_sec = None
    for i, p_el in enumerate(paragraphs):
        text = para_text(p_el)
        if not text:
            continue
        sec = is_section_header(text)
        if sec is not None:
            current_docx_sec = sec
            continue
        art = is_article_header(text)
        if art and current_docx_sec is not None:
            boundaries.append((i, current_docx_sec, art[2]))

    print("=== Images found per article ===")
    orig_sec_count = {}
    for idx, (start_i, docx_sec, title) in enumerate(boundaries):
        end_i = boundaries[idx + 1][0] if idx + 1 < len(boundaries) else n
        orig_sec, _, offset = DOCX_SECTION_MAP.get(docx_sec, (docx_sec, "", 0))
        orig_sec_count[orig_sec] = orig_sec_count.get(orig_sec, 0) + 1
        display_id = f"{orig_sec}.{offset + orig_sec_count[orig_sec]}"

        all_rids_in_range = []
        for i in range(start_i, end_i):
            rids = para_image_rids(paragraphs[i])
            for rid in rids:
                all_rids_in_range.append((i, rid))

        print(f"\n{display_id}: {title[:55]}")
        print(f"  Paragraphs: {start_i}–{end_i-1} ({end_i - start_i} total)")
        if all_rids_in_range:
            for para_i, rid in all_rids_in_range:
                info = all_imgs.get(rid, {})
                txt = para_text(paragraphs[para_i])[:40]
                print(f"  para[{para_i}] rId={rid:6s}  size={info.get('size',0):7d}B  hash={info.get('hash','?')[:8]}  text={repr(txt)}")
        else:
            print("  (no images found in range)")

if __name__ == "__main__":
    main()
