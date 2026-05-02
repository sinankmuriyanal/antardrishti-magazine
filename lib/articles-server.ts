/**
 * Server-only article fetchers — use Firebase Admin SDK.
 * Import these in server components and API routes ONLY.
 */
import { adminDb } from "./firebase-admin";
import type { Article } from "@/types";

function ts(t: unknown): number {
  if (!t) return 0;
  const x = t as { seconds?: number; _seconds?: number };
  return x.seconds ?? x._seconds ?? 0;
}

function sortArticles(articles: Article[]): Article[] {
  return articles.sort((a, b) => {
    // Edition 2 before Edition 1
    const edDiff = (b.edition ?? 1) - (a.edition ?? 1);
    if (edDiff !== 0) return edDiff;
    // Within same edition: newest publishedAt first
    const tDiff = ts(b.publishedAt) - ts(a.publishedAt);
    if (tDiff !== 0) return tDiff;
    // Stable fallback: section asc, article desc
    if (a.sectionNumber !== b.sectionNumber) return a.sectionNumber - b.sectionNumber;
    return b.articleNumber - a.articleNumber;
  });
}

export async function fetchArticlesServer(opts?: {
  sectionNumber?: number;
  published?: boolean;
  limitTo?: number;
}): Promise<Article[]> {
  let q: FirebaseFirestore.Query = adminDb.collection("articles");
  if (opts?.sectionNumber !== undefined)
    q = q.where("sectionNumber", "==", opts.sectionNumber);
  if (opts?.published !== undefined)
    q = q.where("isPublished", "==", opts.published);

  const snap = await q.get();
  let articles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  articles = sortArticles(articles);
  if (opts?.limitTo) articles = articles.slice(0, opts.limitTo);
  return articles;
}

export async function fetchArticleByDisplayIdServer(displayId: string): Promise<Article | null> {
  const snap = await adminDb
    .collection("articles")
    .where("displayId", "==", displayId)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
}

export async function fetchArticleBySlugServer(slug: string): Promise<Article | null> {
  const snap = await adminDb
    .collection("articles")
    .where("slug", "==", slug)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
}
