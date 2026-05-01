"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { adminCreateArticle as createArticle } from "@/lib/articles-admin";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/types";

export default function NewArticlePage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSave(data: Omit<Article, "id" | "createdAt" | "updatedAt">) {
    setSaving(true);
    setError("");
    try {
      await createArticle(data);
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
        <h1 className="text-xl font-bold text-gray-900 mt-1">New article</h1>
      </div>
      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          <span>⚠</span> {error}
        </div>
      )}
      <ArticleForm onSave={handleSave} saving={saving} />
    </AdminShell>
  );
}
