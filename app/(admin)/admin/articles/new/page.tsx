"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { createArticle } from "@/lib/articles";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/types";

export default function NewArticlePage() {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave(data: Omit<Article, "id" | "createdAt" | "updatedAt">) {
    setSaving(true);
    try {
      await createArticle(data);
      router.push("/admin/articles");
    } catch (e) {
      alert("Failed to save article. Check console.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <a href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-900">← Back to articles</a>
        <h1 className="text-xl font-bold text-gray-900 mt-1">New article</h1>
      </div>
      <ArticleForm onSave={handleSave} saving={saving} />
    </AdminShell>
  );
}
