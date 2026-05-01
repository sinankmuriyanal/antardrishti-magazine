"""
extract_docx.py
Parses Antardrishti 2nd Edition.docx and outputs:
  extracted/articles.json    — structured article data
  extracted/images/          — featured + author images

Run from the antardrishti-magazine/ directory:
  pip install python-docx pillow
  python scripts/extract_docx.py

The docx uses the real website section/article numbers directly in its headers:
  "2 Management"  -> section-2
  "2.4 Title"     -> displayId 2.4
  "4 What's Buzzing" -> section-4
  etc.
No mapping required.
"""

import json, re, sys, io
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from PIL import Image

DOCX_PATH = Path("../Antardrishti 2nd Edition.docx")
OUT_DIR   = Path("extracted")
IMG_DIR   = OUT_DIR / "images"

SECTION_NAMES = {
    1: "Editorial",
    2: "Management",
    3: "Analytics",
    4: "What's Buzzing",
    5: "Social",
    6: "Campus Chronicles",
}

_VML_IMAGEDATA = "{urn:schemas-microsoft-com:vml}imagedata"
_R_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def extract_all_images(doc: Document) -> dict:
    """Return {rId: bytes}."""
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
    """
    result = []
    def walk(element):
        for child in element:
            if child.tag == qn("w:p"):
                result.append(child)
            else:
                walk(child)
    walk(doc.element.body)
    return result


def para_text(p_el) -> str:
    return "".join(t.text or "" for t in p_el.iter(qn("w:t"))).strip()


def para_image_rids(p_el) -> list:
    """Find all image rIds — DrawingML (a:blip) + VML (v:imagedata)."""
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


def save_image(data: bytes, path: Path) -> str:
    """Save image as JPEG. path must already include .jpg extension."""
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
    """Return section number if text looks like '2 Management', else None."""
    m = re.match(r"^(\d+)\s+[A-Z‘’'\"]", text)
    if m and not re.match(r"^\d+\.\d+", text):
        return int(m.group(1))
    return None


def is_article_header(text: str):
    """Return (sec_num, art_num, title) if text looks like '2.4 Title', else None."""
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

    paragraphs = all_body_paragraphs(doc)
    n = len(paragraphs)
    print(f"  Found {n} total paragraphs (including table cells)")

    # ── Pass 1: identify article boundaries ──────────────────────────────────
    boundaries = []  # (para_idx, sec_num, art_num, title)

    for i, p_el in enumerate(paragraphs):
        text = para_text(p_el)
        if not text:
            continue
        art = is_article_header(text)
        if art:
            boundaries.append((i, art[0], art[1], art[2]))

    print(f"  Found {len(boundaries)} articles\n")

    # ── Pass 2: extract each article ─────────────────────────────────────────
    articles = []

    for idx, (start_i, sec_num, art_num, title) in enumerate(boundaries):
        end_i = boundaries[idx + 1][0] if idx + 1 < len(boundaries) else n
        display_id = f"{sec_num}.{art_num}"
        sec_id = f"section-{sec_num}"
        safe_id = display_id.replace(".", "_")

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

            # First image after header -> featured
            if rids and not first_image_found:
                featured_image_rid = rids[0]
                first_image_found = True
                continue

            # Author line: last ~8 paras, has image, has comma in text
            is_last_zone = i >= end_i - 8
            if rids and is_last_zone and text and re.search(r",", text):
                author_image_rid = rids[0]
                author_name = text.split(",", 1)[0].strip()
                author_bio = text
                continue

            if text:
                body_paras.append(text)

        html = "\n".join(f"<p>{p}</p>" for p in body_paras)
        excerpt = body_paras[0][:200] + "..." if body_paras else ""

        featured_image_path = ""
        if featured_image_rid and featured_image_rid in all_images:
            out = IMG_DIR / f"article-{safe_id}-featured.jpg"
            featured_image_path = save_image(all_images[featured_image_rid], out)
            print(f"    featured: {Path(featured_image_path).name}")

        author_image_path = ""
        if author_image_rid and author_image_rid in all_images:
            out = IMG_DIR / f"article-{safe_id}-author.jpg"
            author_image_path = save_image(all_images[author_image_rid], out)
            print(f"    author:   {Path(author_image_path).name}")

        articles.append({
            "sectionId": sec_id,
            "sectionNumber": sec_num,
            "articleNumber": art_num,
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

    feat_count = sum(1 for a in articles if a["featuredImage"])
    auth_count = sum(1 for a in articles if a["authorImage"])
    print(f"\nDone! {len(articles)} articles -> {out_path}")
    print(f"  Featured images: {feat_count}/{len(articles)}")
    print(f"  Author images:   {auth_count}/{len(articles)}")
    print("\nNext: run scripts/upload_all_images.js")


if __name__ == "__main__":
    main()
