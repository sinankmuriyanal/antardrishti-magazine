import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
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
  constraints.push(orderBy("sectionNumber"), orderBy("articleNumber"));
  if (opts?.limitTo) constraints.push(limit(opts.limitTo));

  const q = query(collection(db, "articles"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

export async function fetchArticleByDisplayId(displayId: string): Promise<Article | null> {
  const q = query(collection(db, "articles"), where("displayId", "==", displayId));
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
    where("isPublished", "==", true),
    orderBy("publishedAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

export async function createArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "articles"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
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
    where("sectionNumber", "==", sectionNumber),
    orderBy("articleNumber", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 1;
  const last = snap.docs[0].data() as Article;
  return last.articleNumber + 1;
}
