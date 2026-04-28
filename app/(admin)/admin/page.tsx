"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Stats { articles: number; comments: number; pending: number; sections: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ articles: 0, comments: 0, pending: 0, sections: 6 });

  useEffect(() => {
    async function load() {
      try {
        const [artSnap, comSnap, pendSnap] = await Promise.all([
          getDocs(collection(db, "articles")),
          getDocs(collection(db, "comments")),
          getDocs(query(collection(db, "comments"), where("isApproved", "==", false))),
        ]);
        setStats({ articles: artSnap.size, comments: comSnap.size, pending: pendSnap.size, sections: 6 });
      } catch { /* DB not configured */ }
    }
    load();
  }, []);

  const cards = [
    { label: "Total Articles", value: stats.articles, href: "/admin/articles", color: "blue" },
    { label: "Comments",       value: stats.comments, href: "/admin/comments", color: "green" },
    { label: "Pending Review", value: stats.pending,  href: "/admin/comments", color: "amber" },
    { label: "Sections",       value: stats.sections, href: "/admin/sections", color: "purple" },
  ];

  const colorMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-green-50 text-green-700",
    amber:  "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => (
            <a key={c.label} href={c.href} className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg mb-3 ${colorMap[c.color]}`}>
                {c.value}
              </div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-sm text-gray-500">{c.label}</div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Quick actions</h2>
            <div className="space-y-2">
              <a href="/admin/articles/new" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>＋</span> New article
              </a>
              <a href="/admin/import" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>⬆</span> Import from .docx
              </a>
              <a href="/admin/comments" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>💬</span> Moderate comments {stats.pending > 0 && <span className="bg-red-100 text-red-600 text-xs px-1.5 rounded-full">{stats.pending}</span>}
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Setup checklist</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div>□ Create Firebase project &amp; add keys to <code className="text-xs bg-gray-100 px-1 rounded">.env.local</code></div>
              <div>□ Run <code className="text-xs bg-gray-100 px-1 rounded">python scripts/migrate_html.py</code></div>
              <div>□ Run <code className="text-xs bg-gray-100 px-1 rounded">python scripts/extract_docx.py</code></div>
              <div>□ Run <code className="text-xs bg-gray-100 px-1 rounded">node scripts/import_to_firestore.js</code></div>
              <div>□ Enable Firebase Auth (email/password)</div>
              <div>□ Create admin user in Firebase Auth console</div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
