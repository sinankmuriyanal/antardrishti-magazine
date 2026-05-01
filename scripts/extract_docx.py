"""
extract_docx.py — Antardrishti 2nd Edition
Parses the docx and outputs:
  extracted/articles.json    — article data with content HTML including body images
  extracted/images/          — featured, author, and body images

Run from antardrishti-magazine/:
  python scripts/extract_docx.py

The docx uses real website display IDs in its headers:
  "2 Management" -> section-2
  "2.4 Title"    -> displayId 2.4
"""

import json, re, sys, io
from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from PIL import Image

DOCX_PATH = Path("../Antardrishti 2nd Edition.docx")
OUT_DIR   = Path("extracted")
IMG_DIR   = OUT_DIR / "images"

_VML_IMAGEDATA = "{urn:schemas-microsoft-com:vml}imagedata"
_R_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def extract_all_images(doc):
    images = {}
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                images[rel.rId] = rel.target_part.blob
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


def save_image(data, path):
    """Save image bytes as JPEG. path must already include .jpg extension."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(path, "JPEG", quality=85)
        return str(path).replace("\\", "/")  # always forward slashes
    except Exception as e:
        print(f"  Warning: could not save image: {e}")
        return ""


def is_article_header(text):
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
    print(f"  Found {n} total paragraphs\n")

    # ── Pass 1: identify article boundaries ──────────────────────────────────
    boundaries = []
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

        print(f"  {display_id}: {title[:65]}")

        # Collect all images and their sizes to pick the best featured image
        candidate_images = []  # (para_idx, rId, raw_size)
        for i in range(start_i + 1, end_i):
            for rid in para_image_rids(paragraphs[i]):
                if rid in all_images:
                    candidate_images.append((i, rid, len(all_images[rid])))

        if not candidate_images:
            featured_image_rid = None
            author_image_rid = None
            author_candidate_para = None
        else:
            # Author = last candidate that has comma text (in last-zone para)
            author_image_rid = None
            author_candidate_para = None
            author_name = ""
            author_bio = ""
            for i, rid, size in reversed(candidate_images):
                text = para_text(paragraphs[i])
                is_last_zone = i >= end_i - 8
                if is_last_zone and text and re.search(r",", text):
                    author_image_rid = rid
                    author_name = text.split(",", 1)[0].strip()
                    author_bio = text
                    author_candidate_para = i
                    break

            # Featured = largest image in the first half of the article
            # (excludes author image)
            half = start_i + (end_i - start_i) // 2
            non_author = [(i, rid, sz) for i, rid, sz in candidate_images
                          if rid != author_image_rid]
            first_half = [(i, rid, sz) for i, rid, sz in non_author if i <= half]
            rest = [(i, rid, sz) for i, rid, sz in non_author if i > half]

            if first_half:
                # Pick largest in first half
                featured_image_rid = max(first_half, key=lambda x: x[2])[1]
            elif rest:
                featured_image_rid = max(rest, key=lambda x: x[2])[1]
            else:
                featured_image_rid = None

        # Save featured
        featured_image_path = ""
        if featured_image_rid:
            out = IMG_DIR / f"article-{safe_id}-featured.jpg"
            featured_image_path = save_image(all_images[featured_image_rid], out)
            print(f"    featured: {Path(featured_image_path).name}  ({len(all_images[featured_image_rid])//1024}KB raw)")

        # Save author
        author_image_path = ""
        if author_image_rid:
            out = IMG_DIR / f"article-{safe_id}-author.jpg"
            author_image_path = save_image(all_images[author_image_rid], out)
            print(f"    author:   {Path(author_image_path).name}  ({len(all_images[author_image_rid])//1024}KB raw)")

        # Build content HTML — interleave text and body images
        # Body images = all images except featured and author, in document order
        # Deduplicate: same rId appearing multiple times → include only first occurrence
        excluded_rids = {r for r in [featured_image_rid, author_image_rid] if r}
        body_rid_seen = set()

        html_parts = []
        body_img_idx = 0
        body_img_paths = []

        for i in range(start_i + 1, end_i):
            p_el = paragraphs[i]
            text = para_text(p_el)
            rids = para_image_rids(p_el)

            # Skip featured-image paragraph
            if featured_image_rid and featured_image_rid in rids and not html_parts:
                continue

            # Skip author-info paragraph
            if author_candidate_para is not None and i == author_candidate_para:
                continue

            # Embed body images at their natural position
            for rid in rids:
                if rid in excluded_rids:
                    continue
                if rid in body_rid_seen:
                    continue  # skip duplicate occurrence of same image
                body_rid_seen.add(rid)

                if rid in all_images:
                    out = IMG_DIR / f"article-{safe_id}-body-{body_img_idx}.jpg"
                    saved = save_image(all_images[rid], out)
                    if saved:
                        html_parts.append(f'<figure class="article-figure"><img src="{saved}" alt="" /></figure>')
                        body_img_paths.append(saved)
                        body_img_idx += 1
                        print(f"    body[{body_img_idx-1}]:  {Path(saved).name}  ({len(all_images[rid])//1024}KB raw)")

            if text:
                # Skip the author bio line (might appear as text even without image)
                if author_bio and text == author_bio:
                    continue
                html_parts.append(f"<p>{text}</p>")

        html = "\n".join(html_parts)
        excerpt = ""
        for part in html_parts:
            if part.startswith("<p>"):
                raw = re.sub(r"<[^>]+>", "", part).strip()
                if raw:
                    excerpt = raw[:200] + ("..." if len(raw) > 200 else "")
                    break

        articles.append({
            "sectionId": sec_id,
            "sectionNumber": sec_num,
            "articleNumber": art_num,
            "displayId": display_id,
            "title": title,
            "excerpt": excerpt,
            "content": html,
            "featuredImage": featured_image_path,
            "authorName": author_name if 'author_name' in dir() else "",
            "authorImage": author_image_path,
            "authorLinkedIn": "",
            "authorBio": author_bio if 'author_bio' in dir() else "",
            "tags": [],
            "edition": 2,
            "isPublished": True,
            "_bodyImagePaths": body_img_paths,  # used by upload script, removed before DB write
        })

    out_path = OUT_DIR / "articles.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    feat_count = sum(1 for a in articles if a["featuredImage"])
    auth_count = sum(1 for a in articles if a["authorImage"])
    body_total = sum(len(a["_bodyImagePaths"]) for a in articles)
    print(f"\nDone! {len(articles)} articles -> {out_path}")
    print(f"  Featured images: {feat_count}/{len(articles)}")
    print(f"  Author images:   {auth_count}/{len(articles)}")
    print(f"  Body images:     {body_total} total")


if __name__ == "__main__":
    main()
