"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SECTIONS_DATA } from "@/lib/sections";
import type { Article } from "@/types";

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<number | "">("");

  async function load() {
    setLoading(true);
    try {
      const q = query(collection(db, "articles"), orderBy("sectionNumber"), orderBy("articleNumber"));
      const snap = await getDocs(q);
      setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article)));
    } catch { setArticles([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(article: Article) {
    await updateDoc(doc(db, "articles", article.id), { isPublished: !article.isPublished });
    setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, isPublished: !a.isPublished } : a));
  }

  async function handleDelete(article: Article) {
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, "articles", article.id));
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
  }

  const filtered = articles.filter((a) => {
    const matchSection = sectionFilter === "" || a.sectionNumber === sectionFilter;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.authorName?.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  return (
    <AdminShell>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Articles</h1>
          <a href="/admin/articles/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New article
          </a>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="search"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value === "" ? "" : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All sections</option>
            {SECTIONS_DATA.map((s) => <option key={s.id} value={s.number}>{s.name}</option>)}
          </select>
          <span className="text-sm text-gray-500 self-center">{filtered.length} articles</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No articles found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Section</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Ed.</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => {
                  const sec = SECTIONS_DATA.find((s) => s.number === a.sectionNumber);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.displayId}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-xs">{a.title}</div>
                        {a.excerpt && <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{a.excerpt}</div>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{sec?.name}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{a.authorName}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${a.edition === 2 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                          Ed. {a.edition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePublish(a)}
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${a.isPublished ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"} transition-colors`}
                        >
                          {a.isPublished ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/article/${a.displayId}`} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-blue-600">View</a>
                          <a href={`/admin/articles/${a.id}/edit`} className="text-xs text-blue-600 hover:text-blue-800">Edit</a>
                          <button onClick={() => handleDelete(a)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
