"""
extract_docx.py
Parses Antardrishti 2nd Edition.docx and outputs:
  extracted/articles.json    — structured article data
  extracted/images/          — all embedded images

Run from the antardrishti-magazine/ directory:
  pip install python-docx mammoth pillow
  python scripts/extract_docx.py

Article numbering: docx labels like "1.1", "2.1" are remapped to the next
available number in each section (since edition-1 already exists in the DB).
"""

import json
import os
import re
import sys
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from PIL import Image
import io

DOCX_PATH = Path("../Antardrishti 2nd Edition.docx")
OUT_DIR = Path("extracted")
IMG_DIR = OUT_DIR / "images"

# Current max article numbers from edition-1
SECTION_OFFSETS = {1: 1, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4}

SECTION_NAMES = {
    1: "editorial",
    2: "management",
    3: "analytics",
    4: "whats-buzzing",
    5: "social",
    6: "campus-chronicles",
}

SECTION_IDS = {
    1: "section-1", 2: "section-2", 3: "section-3",
    4: "section-4", 5: "section-5", 6: "section-6",
}


def heading_is_article(text: str):
    """Return (section_num, article_num_in_docx) if this looks like an article heading, else None."""
    m = re.match(r"^(\d+)\.(\d+)\s+.+", text.strip())
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def extract_images(doc: Document) -> dict[str, bytes]:
    """Return {relationship_id: image_bytes} for all embedded images."""
    images = {}
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                images[rel.rId] = rel.target_part.blob
            except Exception:
                pass
    return images


def save_image(data: bytes, path: Path) -> str:
    """Save image bytes, converting to JPEG if needed. Returns filename."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        path = path.with_suffix(".jpg")
        img.save(path, "JPEG", quality=85)
        return path.name
    except Exception as e:
        print(f"  Warning: could not save image — {e}")
        return ""


def find_inline_images(paragraph, images_map: dict) -> list[str]:
    """Return list of relationship IDs for images embedded in a paragraph."""
    rids = []
    for run in paragraph.runs:
        for el in run._r.iter():
            if el.tag == qn("a:blip"):
                rid = el.get(qn("r:embed"))
                if rid and rid in images_map:
                    rids.append(rid)
    return rids


def parse_author_block(text: str) -> dict:
    """Try to extract author name and LinkedIn from a block like 'John Doe | linkedin.com/...'"""
    linkedin = ""
    m = re.search(r"(https?://[^\s]+linkedin[^\s]+)", text, re.IGNORECASE)
    if m:
        linkedin = m.group(1)
        text = text.replace(linkedin, "").strip(" |–-")
    name = re.sub(r"\s+", " ", text).strip(" |–-,:").strip()
    return {"name": name, "linkedin": linkedin}


def main():
    if not DOCX_PATH.exists():
        print(f"Error: {DOCX_PATH} not found. Run from antardrishti-magazine/ directory.")
        sys.exit(1)

    OUT_DIR.mkdir(exist_ok=True)
    IMG_DIR.mkdir(exist_ok=True)

    print(f"Loading {DOCX_PATH} …")
    doc = Document(DOCX_PATH)
    all_images = extract_images(doc)
    print(f"  Found {len(all_images)} embedded images")

    articles = []
    current: dict | None = None
    img_counter = 0
    # Map each article's image sequence: first image = featured, second = author
    article_images: dict = {}  # article display_id -> [rids]

    paragraphs = doc.paragraphs

    for i, para in enumerate(paragraphs):
        text = para.text.strip()
        if not text and not find_inline_images(para, all_images):
            continue

        # Check if this paragraph starts a new article
        parsed = heading_is_article(text) if text else None
        inline_imgs = find_inline_images(para, all_images)

        if parsed and para.style.name.startswith("Heading"):
            sec_num, art_num_docx = parsed
            # Remap article number (continue from edition-1 max)
            offset = SECTION_OFFSETS.get(sec_num, 0)
            new_art_num = offset + art_num_docx
            display_id = f"{sec_num}.{new_art_num}"
            title = re.sub(r"^\d+\.\d+\s*", "", text).strip()

            current = {
                "sectionId": SECTION_IDS.get(sec_num, f"section-{sec_num}"),
                "sectionNumber": sec_num,
                "articleNumber": new_art_num,
                "displayId": display_id,
                "title": title,
                "excerpt": "",
                "content": "",
                "featuredImage": "",
                "authorName": "",
                "authorImage": "",
                "authorLinkedIn": "",
                "authorBio": "",
                "tags": [],
                "edition": 2,
                "isPublished": True,
                "_body_paragraphs": [],
                "_image_rids": [],
                "_docx_section": sec_num,
                "_docx_article": art_num_docx,
            }
            articles.append(current)
            article_images[display_id] = []
            print(f"  Article {display_id}: {title}")
            continue

        if current is None:
            continue

        # Collect inline images
        if inline_imgs:
            article_images[current["displayId"]].extend(inline_imgs)

        # Detect author block (common patterns: "Author:", "By ", LinkedIn URL)
        low = text.lower()
        if any(k in low for k in ("linkedin.com", "by author", "author:")):
            parsed_author = parse_author_block(text)
            if parsed_author["name"] and not current["authorName"]:
                current["authorName"] = parsed_author["name"]
            if parsed_author["linkedin"] and not current["authorLinkedIn"]:
                current["authorLinkedIn"] = parsed_author["linkedin"]
            continue

        # Otherwise: body paragraph
        if text:
            current["_body_paragraphs"].append(text)

    # Post-process: build HTML content, save images, set excerpt
    for art in articles:
        did = art["displayId"]
        rids = article_images.get(did, [])

        # Save images
        saved = []
        for j, rid in enumerate(rids):
            if rid in all_images:
                img_counter += 1
                suffix = "featured" if j == 0 else ("author" if j == 1 else f"img{j}")
                fname = f"article-{did}-{suffix}"
                path = IMG_DIR / fname
                saved_name = save_image(all_images[rid], path)
                if saved_name:
                    saved.append(f"extracted/images/{saved_name}")

        if saved:
            art["featuredImage"] = saved[0]
        if len(saved) > 1:
            art["authorImage"] = saved[1]

        # Build HTML content
        paras = art.pop("_body_paragraphs", [])
        html = "\n".join(f"<p>{p}</p>" for p in paras if p)
        art["content"] = html

        # Excerpt = first paragraph, trimmed
        art["excerpt"] = paras[0][:200] + "…" if paras else ""

        # Clean internal keys
        for k in ["_image_rids", "_docx_section", "_docx_article"]:
            art.pop(k, None)

    out_path = OUT_DIR / "articles.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(articles)} articles → {out_path}")
    print(f"Images saved to {IMG_DIR}/")
    print("\nNext step: review extracted/articles.json, then run scripts/import_to_firestore.js")


if __name__ == "__main__":
    main()
