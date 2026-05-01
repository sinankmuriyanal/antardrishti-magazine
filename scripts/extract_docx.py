"""
extract_docx.py
Parses Antardrishti 2nd Edition.docx and outputs:
  extracted/articles.json    — structured article data
  extracted/images/          — featured + author images

Run from the antardrishti-magazine/ directory:
  pip install python-docx pillow
  python scripts/extract_docx.py

Docx section numbering -> original website section mapping:
  Docx 1 (What's Buzzing)    -> section 4, offset 3 (last ed-1: 4.3)
  Docx 2 (Analytics)         -> section 3, offset 4 (last ed-1: 3.4)
  Docx 3 (Management)        -> section 2, offset 3 (last ed-1: 2.3)
  Docx 4 (Social)            -> section 5, offset 3 (last ed-1: 5.3)
  Docx 5 (Campus Chronicles) -> section 6, offset 4 (last ed-1: 6.4)
"""

import json, re, sys, io
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from PIL import Image

DOCX_PATH = Path("../Antardrishti 2nd Edition.docx")
OUT_DIR   = Path("extracted")
IMG_DIR   = OUT_DIR / "images"

DOCX_SECTION_MAP = {
    1: (4, "section-4", 3),   # What's Buzzing
    2: (3, "section-3", 4),   # Analytics
    3: (2, "section-2", 3),   # Management
    4: (5, "section-5", 3),   # Social
    5: (6, "section-6", 4),   # Campus Chronicles
}

# Namespace constants for VML images (not in python-docx default nsmap)
_VML_IMAGEDATA = "{urn:schemas-microsoft-com:vml}imagedata"
_R_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def extract_all_images(doc: Document) -> dict:
    """Return {rId: bytes} from all document relationships."""
    images = {}
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                images[rel.rId] = rel.target_part.blob
            except Exception:
                pass
    return images


def all_body_paragraphs(doc: Document) -> list:
    """
    Return ALL paragraph lxml elements in document order,
    including those nested inside tables and textboxes.
    doc.paragraphs only walks direct children; this does a full recursive walk.
    """
    body = doc.element.body
    result = []

    def walk(element):
        for child in element:
            if child.tag == qn("w:p"):
                result.append(child)
            else:
                walk(child)

    walk(body)
    return result


def para_text(p_el) -> str:
    """Concatenate all w:t text in a paragraph element."""
    parts = []
    for t in p_el.iter(qn("w:t")):
        parts.append(t.text or "")
    return "".join(parts).strip()


def para_image_rids(p_el) -> list:
    """Find all image rIds in a paragraph element (DrawingML + VML)."""
    rids = []
    for blip in p_el.iter(qn("a:blip")):
        rid = blip.get(qn("r:embed"))
        if rid and rid not in rids:
            rids.append(rid)
    for imagedata in p_el.iter(_VML_IMAGEDATA):
        rid = imagedata.get(_R_ID)
        if rid and rid not in rids:
            rids.append(rid)
    return rids


def save_image(data: bytes, path: Path) -> str:
    """Save image as JPEG. path should already have .jpg extension."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(path, "JPEG", quality=85)
        return str(path)
    except Exception as e:
        print(f"  Warning: could not save image - {e}")
        return ""


def is_section_header(text: str):
    m = re.match(r"^(\d+)\s+[A-Z'''\"]", text)
    if m and not re.match(r"^\d+\.\d+", text):
        return int(m.group(1))
    return None


def is_article_header(text: str):
    m = re.match(r"^(\d+)\.(\d+)\s+(.+)", text)
    if m:
        return int(m.group(1)), int(m.group(2)), m.group(3).strip()
    return None


def main():
    if not DOCX_PATH.exists():
        print(f"Error: {DOCX_PATH} not found.")
        sys.exit(1)

    OUT_DIR.mkdir(exist_ok=True)
    IMG_DIR.mkdir(exist_ok=True)

    print(f"Loading {DOCX_PATH} ...")
    doc = Document(DOCX_PATH)
    all_images = extract_all_images(doc)
    print(f"  Found {len(all_images)} embedded images")

    # Walk ALL paragraphs including table cells
    paragraphs = all_body_paragraphs(doc)
    n = len(paragraphs)
    print(f"  Found {n} total paragraphs (including table cells)")

    # ── Pass 1: identify article boundaries ──────────────────────────────────
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
            boundaries.append((i, current_docx_sec, art[0], art[1], art[2]))

    print(f"  Found {len(boundaries)} articles")

    # ── Pass 2: extract each article ─────────────────────────────────────────
    orig_sec_count: dict = {}
    articles = []

    for idx, (start_i, docx_sec, _docx_art_num, title) in enumerate(
        (b[0], b[1], b[2], b[4]) for b in boundaries
    ):
        end_i = boundaries[idx + 1][0] if idx + 1 < len(boundaries) else n

        orig_sec, sec_id, offset = DOCX_SECTION_MAP.get(
            docx_sec, (docx_sec, f"section-{docx_sec}", 0)
        )

        orig_sec_count[orig_sec] = orig_sec_count.get(orig_sec, 0) + 1
        new_art_num = offset + orig_sec_count[orig_sec]
        display_id = f"{orig_sec}.{new_art_num}"

        print(f"  {display_id}: {title[:60]}")

        body_paras = []
        author_name = ""
        author_bio = ""
        author_image_rid = None
        featured_image_rid = None
        first_image_found = False

        for i in range(start_i + 1, end_i):
            p_el = paragraphs[i]
            text = para_text(p_el)
            rids = para_image_rids(p_el)

            if rids and not first_image_found:
                featured_image_rid = rids[0]
                first_image_found = True
                continue

            is_last_zone = i >= end_i - 8
            if rids and is_last_zone and text and re.search(r",", text):
                author_image_rid = rids[0]
                parts = [p.strip() for p in text.split(",", 1)]
                author_name = parts[0]
                author_bio = text
                continue

            if text:
                body_paras.append(text)

        html = "\n".join(f"<p>{p}</p>" for p in body_paras)
        excerpt = body_paras[0][:200] + "..." if body_paras else ""

        # Use underscore for dot in display_id to avoid pathlib suffix confusion
        safe_id = display_id.replace(".", "_")

        featured_image_path = ""
        if featured_image_rid and featured_image_rid in all_images:
            out = IMG_DIR / f"article-{safe_id}-featured.jpg"
            featured_image_path = save_image(all_images[featured_image_rid], out)
            print(f"    featured image: {featured_image_path}")

        author_image_path = ""
        if author_image_rid and author_image_rid in all_images:
            out = IMG_DIR / f"article-{safe_id}-author.jpg"
            author_image_path = save_image(all_images[author_image_rid], out)
            print(f"    author image:   {author_image_path}")

        articles.append({
            "sectionId": sec_id,
            "sectionNumber": orig_sec,
            "articleNumber": new_art_num,
            "displayId": display_id,
            "title": title,
            "excerpt": excerpt,
            "content": html,
            "featuredImage": featured_image_path,
            "authorName": author_name,
            "authorImage": author_image_path,
            "authorLinkedIn": "",
            "authorBio": author_bio,
            "tags": [],
            "edition": 2,
            "isPublished": True,
        })

    out_path = OUT_DIR / "articles.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(articles)} articles -> {out_path}")
    print(f"Images saved to {IMG_DIR}/")

    # Summary
    feat_count = sum(1 for a in articles if a["featuredImage"])
    auth_count = sum(1 for a in articles if a["authorImage"])
    print(f"  Featured images extracted: {feat_count}/{len(articles)}")
    print(f"  Author images extracted:   {auth_count}/{len(articles)}")


if __name__ == "__main__":
    main()
