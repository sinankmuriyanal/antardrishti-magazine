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
title, excerpt, content (HTML),
featuredImage (Storage URL), authorName, authorImage, authorLinkedIn, authorBio,
tags[], edition (1|2), isPublished, publishedAt, createdAt, updatedAt
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