"""
migrate_html.py
Parses all 18 blog-X.Y.html files from the cloned Magazine repo and outputs:
  extracted/existing_articles.json

Run from the antardrishti-magazine/ directory:
  pip install beautifulsoup4 requests
  python scripts/migrate_html.py
"""

import json
import re
import os
import sys
from pathlib import Path
from bs4 import BeautifulSoup

MAGAZINE_DIR = Path("../Magazine")
OUT_DIR = Path("extracted")

SECTION_MAP = {
    1: {"id": "section-1", "name": "Editorial",        "slug": "editorial"},
    2: {"id": "section-2", "name": "Management",       "slug": "management"},
    3: {"id": "section-3", "name": "Analytics",        "slug": "analytics"},
    4: {"id": "section-4", "name": "What's Buzzing",   "slug": "whats-buzzing"},
    5: {"id": "section-5", "name": "Social",           "slug": "social"},
    6: {"id": "section-6", "name": "Campus Chronicles","slug": "campus-chronicles"},
}


def parse_article(html_path: Path) -> dict | None:
    m = re.match(r"blog-(\d+)\.(\d+)\.html", html_path.name)
    if not m:
        return None
    sec_num = int(m.group(1))
    art_num = int(m.group(2))
    display_id = f"{sec_num}.{art_num}"

    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")

    # --- Title ---
    title_el = soup.select_one("article.single-post h1, article.single-post .post-title")
    title = title_el.get_text(strip=True) if title_el else ""

    # --- Featured image ---
    feat_el = soup.select_one("article.single-post .featured-image img")
    featured_image = ""
    if feat_el:
        src = feat_el.get("src") or feat_el.get("data-src") or ""
        # Convert relative path to a usable reference
        featured_image = src.replace("assets/", "/assets/")

    # --- Content ---
    content_el = soup.select_one(".post-content")
    content_html = ""
    excerpt = ""
    if content_el:
        content_html = str(content_el)
        # Rewrite relative asset paths
        content_html = content_html.replace('src="assets/', 'src="/assets/')
        content_html = content_html.replace("src='assets/", "src='/assets/")
        # Excerpt from first <p>
        first_p = content_el.find("p")
        if first_p:
            raw = first_p.get_text(strip=True)
            excerpt = raw[:200] + "…" if len(raw) > 200 else raw

    # --- Author ---
    author_box = soup.select_one(".post-author")
    author_name = ""
    author_image = ""
    author_linkedin = ""
    author_bio = ""
    if author_box:
        name_el = author_box.select_one("h4, h3, h5")
        author_name = name_el.get_text(strip=True) if name_el else ""

        bio_el = author_box.select_one("p")
        author_bio = bio_el.get_text(strip=True) if bio_el else ""

        img_el = author_box.select_one("img")
        if img_el:
            src = img_el.get("src") or img_el.get("data-src") or ""
            author_image = src.replace("assets/", "/assets/")

        link_el = author_box.select_one("a[href*='linkedin']")
        author_linkedin = link_el["href"] if link_el else ""

    sec_info = SECTION_MAP.get(sec_num, {})

    return {
        "sectionId": sec_info.get("id", f"section-{sec_num}"),
        "sectionNumber": sec_num,
        "articleNumber": art_num,
        "displayId": display_id,
        "title": title,
        "excerpt": excerpt,
        "content": content_html,
        "featuredImage": featured_image,
        "authorName": author_name,
        "authorImage": author_image,
        "authorLinkedIn": author_linkedin,
        "authorBio": author_bio,
        "tags": [],
        "edition": 1,
        "isPublished": True,
    }


def main():
    if not MAGAZINE_DIR.exists():
        print(f"Error: {MAGAZINE_DIR} not found. Ensure Magazine/ is cloned next to antardrishti-magazine/")
        sys.exit(1)

    OUT_DIR.mkdir(exist_ok=True)

    html_files = sorted(MAGAZINE_DIR.glob("blog-*.html"))
    if not html_files:
        print("No blog-*.html files found in Magazine/")
        sys.exit(1)

    articles = []
    for path in html_files:
        result = parse_article(path)
        if result:
            articles.append(result)
            print(f"  Parsed {path.name}: {result['title'][:60]}")

    out_path = OUT_DIR / "existing_articles.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(articles)} articles → {out_path}")
    print("Next step: run scripts/import_to_firestore.js")


if __name__ == "__main__":
    main()
