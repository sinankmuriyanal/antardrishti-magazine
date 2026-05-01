/**
 * Admin-side article operations — all calls go through API routes (Firebase Admin SDK),
 * so Firestore security rules are bypassed. Use these in admin client components only.
 */
import type { Article } from "@/types";

async function apiCall(url: string, opts?: RequestInit) {
  const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function adminFetchArticles(opts?: { sectionNumber?: number; edition?: number }): Promise<Article[]> {
  const params = new URLSearchParams();
  if (opts?.sectionNumber !== undefined) params.set("section", String(opts.sectionNumber));
  const url = `/api/articles${params.size ? `?${params}` : ""}`;
  const data = await apiCall(url);
  let articles = data as Article[];
  if (opts?.edition !== undefined) articles = articles.filter((a) => a.edition === opts.edition);
  return articles;
}

export async function adminFetchArticleById(id: string): Promise<Article | null> {
  try {
    const data = await apiCall(`/api/articles/${encodeURIComponent(id)}`);
    return data as Article;
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) return null;
    throw e;
  }
}

export async function adminCreateArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const res = await apiCall("/api/articles", { method: "POST", body: JSON.stringify(data) });
  return (res as { id: string }).id;
}

export async function adminUpdateArticle(id: string, data: Partial<Article>): Promise<void> {
  await apiCall(`/api/articles/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function adminDeleteArticle(id: string): Promise<void> {
  await apiCall(`/api/articles/${encodeURIComponent(id)}`, { method: "DELETE" });
}
