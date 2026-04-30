import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Article } from "@/types";

export async function fetchArticles(opts?: {
  sectionNumber?: number;
  published?: boolean;
  limitTo?: number;
}): Promise<Article[]> {
  const constraints: Parameters<typeof query>[1][] = [];
  if (opts?.sectionNumber !== undefined)
    constraints.push(where("sectionNumber", "==", opts.sectionNumber));
  if (opts?.published !== undefined)
    constraints.push(where("isPublished", "==", opts.published));

  const q = query(collection(db, "articles"), ...constraints);
  const snap = await getDocs(q);
  let articles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));

  // Sort client-side (31 articles — no composite index needed)
  articles.sort((a, b) =>
    a.sectionNumber !== b.sectionNumber
      ? a.sectionNumber - b.sectionNumber
      : a.articleNumber - b.articleNumber
  );

  if (opts?.limitTo) articles = articles.slice(0, opts.limitTo);
  return articles;
}

export async function fetchArticleByDisplayId(displayId: string): Promise<Article | null> {
  const q = query(collection(db, "articles"), where("displayId", "==", displayId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(collection(db, "articles"), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const snap = await getDoc(doc(db, "articles", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Article;
}

export async function fetchLatestArticles(count = 6): Promise<Article[]> {
  const q = query(
    collection(db, "articles"),
    where("isPublished", "==", true)
  );
  const snap = await getDocs(q);
  const articles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  return articles
    .sort((a, b) => {
      const aT = (a.publishedAt as unknown as { seconds: number })?.seconds ?? 0;
      const bT = (b.publishedAt as unknown as { seconds: number })?.seconds ?? 0;
      return bT - aT;
    })
    .slice(0, count);
}

export async function createArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = doc(db, "articles", data.displayId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return data.displayId;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<void> {
  await updateDoc(doc(db, "articles", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await deleteDoc(doc(db, "articles", id));
}

export async function getNextArticleNumber(sectionNumber: number): Promise<number> {
  const q = query(
    collection(db, "articles"),
    where("sectionNumber", "==", sectionNumber)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 1;
  const nums = snap.docs.map((d) => (d.data() as Article).articleNumber);
  return Math.max(...nums) + 1;
}
