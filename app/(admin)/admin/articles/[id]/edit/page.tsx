"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { fetchArticleById, updateArticle } from "@/lib/articles";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Article } from "@/types";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchArticleById(id)
      .then((a) => { setArticle(a); setLoading(false); })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load article.");
        setLoading(false);
      });
  }, [id]);

  async function handleSave(data: Omit<Article, "id" | "createdAt" | "updatedAt">) {
    setSaving(true);
    setError("");
    try {
      await updateArticle(id, data);
      router.push("/admin/articles");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("permission") ? "Permission denied — check Firebase rules." : `Save failed: ${msg}`);
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <a href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-900">← Back to articles</a>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          {loading ? "Loading…" : article ? `Edit: ${article.title}` : "Article not found"}
        </h1>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          <span>⚠</span> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          Loading article…
        </div>
      ) : !article ? (
        <div className="text-sm text-red-500">
          Article not found. It may have been deleted, or the ID in the URL is incorrect.
        </div>
      ) : (
        <ArticleForm initial={article} onSave={handleSave} saving={saving} />
      )}
    </AdminShell>
  );
}
