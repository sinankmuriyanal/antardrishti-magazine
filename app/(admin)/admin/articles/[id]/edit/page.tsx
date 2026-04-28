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
  const router = useRouter();

  useEffect(() => {
    fetchArticleById(id).then((a) => { setArticle(a); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  async function handleSave(data: Omit<Article, "id" | "createdAt" | "updatedAt">) {
    setSaving(true);
    try {
      await updateArticle(id, data);
      router.push("/admin/articles");
    } catch (e) {
      alert("Failed to update article.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <a href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-900">← Back to articles</a>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Edit article</h1>
      </div>
      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : !article ? (
        <div className="text-sm text-red-500">Article not found.</div>
      ) : (
        <ArticleForm initial={article} onSave={handleSave} saving={saving} />
      )}
    </AdminShell>
  );
}
