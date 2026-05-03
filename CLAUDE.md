# Antardrishti Magazine — Next.js App

DSE MBA Business Analytics magazine. Converts the static HTML/UIKit site at `antardrishtidse/Magazine` into a full-stack Next.js app with Firebase backend and admin panel.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling (public) | UIKit CSS (copied from original repo to `/public/assets/`) |
| Styling (admin) | Tailwind CSS |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Auth | Firebase Auth (email/password, admin only) |
| Rich text | Tiptap |
| Deploy | Vercel |

---

## Commands

```bash
# Dev server
npm run dev

# One-time setup: parse existing HTML and docx, then import to Firestore
pip install python-docx beautifulsoup4 pillow requests
python scripts/extract_docx.py       # parse docx → extracted/articles.json + images
python scripts/migrate_html.py       # parse HTML → extracted/existing_articles.json
node --env-file=.env.local scripts/import_to_firestore.js
```

---

## Environment variables

Copy `.env.local.example` → `.env.local` and fill in from Firebase console.

Required keys:
- `NEXT_PUBLIC_FIREBASE_*` — client SDK (6 keys)
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` — admin SDK

---

## Project structure

```
app/
  (public)/layout.tsx          UIKit shell — header, footer, modals, JS scripts
  (public)/page.tsx            Homepage (hero grid + section rows + latest)
  (public)/section/[slug]/     Section listing
  (public)/article/[displayId]/Article detail (full UIKit template)
  (public)/about-us/           About page
  (public)/all-articles/       All articles with section filter
  (admin)/admin/page.tsx       Dashboard (stats + setup checklist)
  (admin)/admin/articles/      List + new + edit
  (admin)/admin/comments/      Moderation queue (approve/delete)
  (admin)/admin/sections/      Section reference table
  (admin)/admin/import/        Docx upload UI
  api/articles/route.ts        GET list, POST create
  api/comments/route.ts        GET approved, POST submit
  api/import/route.ts          POST upload docx → parse preview
  api/import/confirm/route.ts  POST confirm → write to Firestore
components/
  public/ArticleCard.tsx       HeroArticleCard / MediumArticleCard / ListArticleCard
  public/CommentSection.tsx    Client component: comment form + approved list
  admin/AdminShell.tsx         Firebase Auth gate + sidebar nav
  admin/ArticleForm.tsx        Tiptap editor + image upload to Storage
lib/
  firebase.ts                  Client SDK (browser + server reads)
  firebase-admin.ts            Admin SDK (server only — API routes)
  articles.ts                  Firestore CRUD helpers
  sections.ts                  Section data + fetchSections()
  comments.ts                  Comment CRUD helpers
types/index.ts                 Article, Section, Comment interfaces
scripts/
  extract_docx.py              Parse Antardrishti 2nd Edition.docx → JSON + images
  migrate_html.py              Parse 18 blog-X.Y.html files → JSON
  import_to_firestore.js       Seed sections + articles + upload images to Storage
public/assets/                 UIKit CSS/JS/fonts/images (from Magazine repo)
Magazine/                      Cloned antardrishtidse/Magazine (source HTML)
```

---

## Firestore schema

**`articles`** — document ID = displayId (e.g. `"2.4"`)
```
sectionId, sectionNumber, articleNumber, displayId,
slug (URL slug, e.g. "the-future-of-analytics"),
title, subtitle?, excerpt, content (HTML),
readingTime (minutes, auto-calc), isEditorsPick,
featuredImage (Storage URL), authorName, authorImage, authorLinkedIn, authorBio, authorId?,
tags[], edition (1|2), isPublished, publishedAt, createdAt, updatedAt
```

**`authors`** — document ID = slug (e.g. `"sinan-khan"`)
```
name, bio, photo (Storage URL), linkedin, slug, createdAt, updatedAt
```

**`sections`** — document ID = `"section-N"`
```
number, name, slug, description, order
```

**`comments`**
```
articleId, authorName, authorEmail, content, isApproved, createdAt
```

---

## Article numbering rule

Edition-2 articles (from docx) continue from the edition-1 max per section:

| Section | Ed-1 last | Ed-2 starts |
|---------|-----------|-------------|
| 1 Editorial | 1.1 | **1.2** |
| 2 Management | 2.3 | **2.4** |
| 3 Analytics | 3.4 | **3.5** |
| 4 What's Buzzing | 4.3 | **4.4** |
| 5 Social | 5.3 | **5.4** |
| 6 Campus Chronicles | 6.4 | **6.5** |

---

## Setup checklist

- [ ] Create Firebase project — enable Firestore, Storage, Auth (email/password)
- [ ] Copy `.env.local.example` → `.env.local` and fill in Firebase keys
- [ ] Create admin user in Firebase Auth console
- [ ] `python scripts/migrate_html.py` — extracts 18 edition-1 articles from HTML
- [ ] `python scripts/extract_docx.py` — extracts edition-2 articles from docx
- [ ] Review `extracted/articles.json` — fix any mis-parsed titles/authors
- [ ] `node --env-file=.env.local scripts/import_to_firestore.js` — seeds DB
- [ ] `npm run dev` — verify homepage, sections, articles, dark mode
- [ ] Go to `/admin` — sign in, test article CRUD and comment moderation
- [ ] Deploy to Vercel — add env vars in Vercel dashboard


## Changelog

- [2026-04-28] init: Antardrishti magazine — Next.js + Firebase backend with admin panel
- [2026-04-28] docs(changelog): sync 2026-04-28
- [2026-04-29] update: app/(public)/layout.tsx,app/layout.tsx,next.config.ts,scripts/extract_docx.py,scripts/migrate_html.py
- [2026-04-29] deploy: add Vercel env seeding script and .vercel gitignore entry
- [2026-04-29] fix: serve all public pages via Firebase Admin SDK, remove boilerplate root page
- [2026-04-29] fix: disable UIKit page preloader, extend ISR cache to 1 hour
- [2026-04-30] design: full professional redesign — Playfair Display + DM Sans fonts, deep navy (#0F1923) + warm cream palette, editorial article cards, refined header/footer, redesigned About Us with section cards, improved article reading typography and author bio, pill filter tabs on archive, dark sidebar admin shell with brand accent
- [2026-04-30] docs(changelog): sync 2026-04-29
- [2026-04-30] docs(changelog): sync 2026-04-30
- [2026-04-30] update: (admin)/admin/articles/page.tsx,(admin)/admin/page.tsx,(public)/article/[displayId]/page.tsx,admin/ArticleForm.tsx,CLAUDE.md,globals.css
- [2026-05-01] feat: admin CRUD overhaul — all admin data ops now route through Firebase Admin SDK API routes (bypasses Firestore security rules); added /api/articles/[id] and /api/comments/[id] PATCH/DELETE; added lib/articles-admin.ts fetch-based helpers; admin dashboard, articles list, comments page, and CommentSection all migrated off client Firestore SDK
- [2026-05-01] feat: article slug system — slugify() utility, slug field on Article type, auto-generate slug from title in ArticleForm (with manual override), /admin/migrate-slugs one-click migration tool, fetchArticleBySlug server + client helpers
- [2026-05-01] feat: authors collection — Author type, lib/authors.ts CRUD, /admin/authors page with photo upload and inline edit, author slug as Firestore doc ID
- [2026-05-01] feat: admin ArticleForm additions — isEditorsPick amber toggle, subtitle field, readingTime auto-calc from word count, inline error display replaces alert() calls, edit page shows article title in breadcrumb
- [2026-05-01] feat: editor's pick star toggle column in admin articles list, View link uses slug if present
- [2026-05-01] feat: admin API migration, slug system, authors collection, hooks
- [2026-05-01] docs(changelog): sync 2026-05-01
- [2026-05-01] update: (admin)/admin/articles/page.tsx,(admin)/admin/authors/page.tsx,(admin)/admin/page.tsx,(public)/article/[slug]/page.tsx,(public)/layout.tsx,(public)/page.tsx
- [2026-05-01] update: (admin)/admin/articles/page.tsx,(admin)/admin/authors/page.tsx,(public)/article/[slug]/page.tsx,(public)/page.tsx,CLAUDE.md
- [2026-05-01] fix: article page images — strip UIKit data-uc-img to prevent src overwrite with relative data-src paths
- [2026-05-01] fix: ensure all image URLs are absolute — prevent relative paths resolving to /article/assets/... on non-root routes
- [2026-05-01] update: extract_docx.py,upload_all_images.js
- [2026-05-02] update: debug_images.py,dump_headers.py,extract_docx.py,fix_firestore.js
- [2026-05-02] update: check_content_images.js,check_firestore_images.js,extract_docx.py,fix_firestore.js
- [2026-05-02] update: bust_image_cache.js,check_all_urls.js,debug_author_images.js,globals.css,reupload_fresh_paths.js,verify_storage_images.js
- [2026-05-02] update: fix_2_2_image.js,globals.css
- [2026-05-02] docs(changelog): sync 2026-05-02
- [2026-05-02] update: (public)/article/[slug]/page.tsx
- [2026-05-02] update: public/ArticleCard.tsx
- [2026-05-02] update: CLAUDE.md,extracted - Shortcut.lnk,patch_reading_time.js
- [2026-05-02] update: (admin)/admin/authors/page.tsx,admin/ArticleForm.tsx,api/upload/route.ts,public/ArticleCard.tsx
- [2026-05-02] update: (admin)/admin/articles/page.tsx,(admin)/admin/page.tsx,(admin)/admin/team/page.tsx,(public)/article/[slug]/page.tsx,(public)/layout.tsx,(public)/team/page.tsx
- [2026-05-02] update: (public)/layout.tsx,public/NavClient.tsx
- [2026-05-02] update: (admin)/admin/page.tsx
- [2026-05-02] update: (public)/page.tsx,(public)/section/[slug]/page.tsx,add_vercel_env.js,bust_image_cache.js,check_all_urls.js,check_content_images.js
- [2026-05-02] update: (public)/page.tsx,(public)/section/[slug]/page.tsx,articles-server.ts
- [2026-05-02] update: (public)/page.tsx,(public)/section/[slug]/page.tsx,public/ArticleCard.tsx
- [2026-05-02] update: (admin)/admin/hero/page.tsx,(public)/page.tsx,admin/AdminShell.tsx,api/hero/route.ts
- [2026-05-02] update: (public)/layout.tsx,(public)/page.tsx,globals.css,public/NavClient.tsx
- [2026-05-02] update: (public)/layout.tsx,(public)/page.tsx,api/hero/route.ts,globals.css,public/ArticleCard.tsx,public/NavClient.tsx
- [2026-05-03] update: (public)/layout.tsx,(public)/page.tsx,public/ArticleCard.tsx
- [2026-05-03] update: (admin)/admin/articles/page.tsx,(admin)/admin/authors/page.tsx,(admin)/admin/comments/page.tsx,(admin)/admin/hero/page.tsx,(admin)/admin/import/page.tsx,(admin)/admin/team/page.tsx
- [2026-05-03] fix: search to top-right on mobile, dark mode tokens + sync, views label
- [2026-05-03] fix: mobile nav — remove theme toggle, fix floating button icon, increase logo padding