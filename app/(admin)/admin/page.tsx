"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Article } from "@/types";

interface Stats {
  articles: number;
  published: number;
  comments: number;
  pending: number;
  missingCover: number;
  missingAuthorPhoto: number;
  missingArticles: { id: string; title: string; displayId: string; missingCover: boolean; missingPhoto: boolean }[];
}

const EMPTY: Stats = { articles: 0, published: 0, comments: 0, pending: 0, missingCover: 0, missingAuthorPhoto: 0, missingArticles: [] };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [artSnap, comSnap, pendSnap] = await Promise.all([
          getDocs(collection(db, "articles")),
          getDocs(collection(db, "comments")),
          getDocs(query(collection(db, "comments"), where("isApproved", "==", false))),
        ]);

        const articles = artSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
        const missingCoverList = articles.filter((a) => !a.featuredImage);
        const missingPhotoList = articles.filter((a) => !a.authorImage);
        const allMissing = articles
          .filter((a) => !a.featuredImage || !a.authorImage)
          .map((a) => ({
            id: a.id,
            title: a.title,
            displayId: a.displayId,
            missingCover: !a.featuredImage,
            missingPhoto: !a.authorImage,
          }));

        setStats({
          articles: artSnap.size,
          published: articles.filter((a) => a.isPublished).length,
          comments: comSnap.size,
          pending: pendSnap.size,
          missingCover: missingCoverList.length,
          missingAuthorPhoto: missingPhotoList.length,
          missingArticles: allMissing,
        });
      } catch { /* DB not configured */ }
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    {
      label: "Total Articles",
      value: stats.articles,
      sub: `${stats.published} published`,
      href: "/admin/articles",
      color: "#e8521d",
      bg: "#fef3f0",
    },
    {
      label: "Comments",
      value: stats.comments,
      sub: stats.pending > 0 ? `${stats.pending} need review` : "All reviewed",
      href: "/admin/comments",
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Missing Cover",
      value: stats.missingCover,
      sub: "articles need images",
      href: "/admin/articles",
      color: stats.missingCover > 0 ? "#dc2626" : "#16a34a",
      bg: stats.missingCover > 0 ? "#fef2f2" : "#f0fdf4",
    },
    {
      label: "Missing Author Photo",
      value: stats.missingAuthorPhoto,
      sub: "authors need photos",
      href: "/admin/articles",
      color: stats.missingAuthorPhoto > 0 ? "#d97706" : "#16a34a",
      bg: stats.missingAuthorPhoto > 0 ? "#fffbeb" : "#f0fdf4",
    },
  ];

  return (
    <AdminShell>
      <div className="max-w-5xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Antardrishti Magazine — Content overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="block rounded-xl border p-5 transition-shadow hover:shadow-md"
              style={{ borderColor: "#f0ece8", background: "white" }}
            >
              <div
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold mb-3"
                style={{ background: c.bg, color: c.color }}
              >
                {loading ? "…" : c.value}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">
                {loading ? <span className="text-gray-200">—</span> : c.value}
              </div>
              <div className="text-sm font-medium text-gray-700">{c.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* Quick actions */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#f0ece8" }}>
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs text-gray-400">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { href: "/admin/articles/new", label: "Write a new article", icon: "+" },
                { href: "/admin/import", label: "Import from .docx file", icon: "↑" },
                { href: "/admin/comments", label: `Moderate comments${stats.pending > 0 ? ` (${stats.pending} pending)` : ""}`, icon: "◇" },
                { href: "/admin/articles", label: "Manage all articles", icon: "◻" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "#fef3f0", color: "#e8521d" }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.href === "/admin/comments" && stats.pending > 0 && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                      {stats.pending}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Setup checklist */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#f0ece8" }}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Setup Checklist
            </h2>
            <div className="space-y-2.5 text-sm">
              {[
                { text: "Create Firebase project & add keys to .env.local", code: null },
                { text: "Run extraction script", code: "python scripts/migrate_html.py" },
                { text: "Run docx extractor", code: "python scripts/extract_docx.py" },
                { text: "Seed Firestore", code: "node scripts/import_to_firestore.js" },
                { text: "Enable Firebase Auth (email/password)", code: null },
                { text: "Create admin user in Firebase Auth console", code: null },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-gray-300 mt-0.5 flex-shrink-0">□</span>
                  <span>
                    {item.text}
                    {item.code && (
                      <>
                        {" "}
                        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          {item.code}
                        </code>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Missing images table */}
        {!loading && stats.missingArticles.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f5f3f0" }}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Articles missing images</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {stats.missingArticles.length} article{stats.missingArticles.length !== 1 ? "s" : ""} need attention — assign someone to add them via Edit
                </p>
              </div>
              <a
                href="/admin/articles"
                className="text-xs font-semibold hover:opacity-80"
                style={{ color: "#e8521d" }}
              >
                View all →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr style={{ background: "#faf9f6" }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Article</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cover</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author Photo</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.missingArticles.map((a, i) => (
                    <tr
                      key={a.id}
                      style={{ borderTop: "1px solid #f5f3f0" }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-800 truncate" style={{ maxWidth: 260 }}>
                        {a.title}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-400">{a.displayId}</td>
                      <td className="px-3 py-3 text-center">
                        {a.missingCover ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-400" title="Missing" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-400" title="Present" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {a.missingPhoto ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Missing" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-400" title="Present" />
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={`/admin/articles/${a.id}/edit`}
                          className="text-xs font-semibold hover:opacity-70 transition-opacity"
                          style={{ color: "#e8521d" }}
                        >
                          Edit →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && stats.missingArticles.length === 0 && stats.articles > 0 && (
          <div
            className="rounded-xl border px-5 py-4 flex items-center gap-3"
            style={{ borderColor: "#d1fae5", background: "#f0fdf4" }}
          >
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-green-800">All images present</p>
              <p className="text-xs text-green-600">Every article has both a cover image and an author photo.</p>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}
