"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { adminFetchArticles, adminUpdateArticle, adminDeleteArticle } from "@/lib/articles-admin";
import { authedFetch } from "@/lib/auth-client";
import { SECTIONS_DATA } from "@/lib/sections";
import type { Article } from "@/types";

function ImageDot({ url, label }: { url?: string; label: string }) {
  const has = !!url;
  return (
    <div className="flex items-center gap-1" title={`${label}: ${has ? url : "missing"}`}>
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: has ? "#22c55e" : "#ef4444" }}
      />
      <span className="text-xs text-gray-400 hidden xl:inline">{label}</span>
    </div>
  );
}

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<number | "">("");
  const [editionFilter, setEditionFilter] = useState<1 | 2 | "">("");
  const [slugging, setSluggging] = useState(false);
  const [slugMsg, setSlugMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const all = await adminFetchArticles();
      setArticles(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setArticles([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  type ArticleStatus = "published" | "draft" | "archived";
  function getStatus(a: Article): ArticleStatus {
    if ((a as Article & { status?: string }).status === "archived") return "archived";
    return a.isPublished ? "published" : "draft";
  }

  async function setStatus(article: Article, status: ArticleStatus) {
    const update = {
      status,
      isPublished: status === "published",
    };
    await adminUpdateArticle(article.id, update);
    setArticles((prev) => prev.map((a) =>
      a.id === article.id ? { ...a, ...update } : a
    ));
  }

  async function togglePublish(article: Article) {
    await adminUpdateArticle(article.id, { isPublished: !article.isPublished });
    setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, isPublished: !a.isPublished } : a));
  }

  async function toggleEditorsPick(article: Article) {
    await adminUpdateArticle(article.id, { isEditorsPick: !article.isEditorsPick });
    setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, isEditorsPick: !a.isEditorsPick } : a));
  }

  async function handleDelete(article: Article) {
    if (!confirm(`Delete "${article.title}"?\n\nThis cannot be undone.`)) return;
    await adminDeleteArticle(article.id);
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
  }

  const filtered = articles.filter((a) => {
    const matchSection = sectionFilter === "" || a.sectionNumber === sectionFilter;
    const matchEdition = editionFilter === "" || a.edition === editionFilter;
    const matchSearch = !search
      || a.title.toLowerCase().includes(search.toLowerCase())
      || (a.authorName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSection && matchEdition && matchSearch;
  });

  const missingFeatured = articles.filter((a) => !a.featuredImage).length;
  const missingAuthor = articles.filter((a) => !a.authorImage).length;
  const missingSlugs = articles.filter((a) => !a.slug).length;

  async function generateSlugs() {
    setSluggging(true);
    setSlugMsg("");
    try {
      const res = await authedFetch("/api/admin/migrate-slugs", { method: "POST" });
      const data = await res.json() as { updated?: number; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSlugMsg(data.message ?? `Updated ${data.updated} articles.`);
      await load();
    } catch (e) { setSlugMsg(String(e)); }
    setSluggging(false);
  }

  return (
    <AdminShell>
      <div className="max-w-7xl">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Articles</h1>
            {!loading && articles.length > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">
                {articles.length} total
                {missingFeatured > 0 && (
                  <span className="text-red-500 ml-2">· {missingFeatured} missing cover image</span>
                )}
                {missingAuthor > 0 && (
                  <span className="text-amber-500 ml-2">· {missingAuthor} missing author photo</span>
                )}
              </p>
            )}
          </div>
          <a
            href="/admin/articles/new"
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
            style={{ background: "#e8521d" }}
          >
            <span className="text-base leading-none">+</span> New Article
          </a>
        </div>

        {/* Slug migration banner */}
        {!loading && missingSlugs > 0 && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl px-5 py-3.5 border" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {missingSlugs} article{missingSlugs !== 1 ? "s" : ""} have no URL slug
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                URLs currently show numbers like <code className="font-mono bg-amber-100 px-1 rounded">/article/1.1</code> — generate slugs to get clean URLs like <code className="font-mono bg-amber-100 px-1 rounded">/article/editorial-note</code>
              </p>
              {slugMsg && <p className="text-xs text-amber-700 mt-1 font-medium">{slugMsg}</p>}
            </div>
            <button
              onClick={generateSlugs}
              disabled={slugging}
              className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-50"
              style={{ background: "#d97706" }}
            >
              {slugging ? "Generating…" : "Generate slugs"}
            </button>
          </div>
        )}
        {!loading && missingSlugs === 0 && slugMsg && (
          <div className="mb-5 rounded-xl px-5 py-3 border text-sm text-green-700 font-medium" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            {slugMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="search"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ minWidth: 220, "--tw-ring-color": "#e8521d" } as React.CSSProperties}
          />
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value === "" ? "" : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
          >
            <option value="">All sections</option>
            {SECTIONS_DATA.map((s) => (
              <option key={s.id} value={s.number}>{s.name}</option>
            ))}
          </select>
          <select
            value={editionFilter}
            onChange={(e) => setEditionFilter(e.target.value === "" ? "" : parseInt(e.target.value) as 1 | 2)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
          >
            <option value="">All editions</option>
            <option value={1}>Edition 1</option>
            <option value={2}>Edition 2</option>
          </select>
          {(search || sectionFilter !== "" || editionFilter !== "") && (
            <button
              onClick={() => { setSearch(""); setSectionFilter(""); setEditionFilter(""); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg bg-white"
            >
              Clear
            </button>
          )}
          <span className="text-sm text-gray-400 self-center ml-auto">
            {filtered.length} of {articles.length}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading articles…</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-2xl mb-3" style={{ opacity: 0.3 }}>⚠</div>
              <p className="text-sm text-red-600 font-medium mb-1">Could not load articles</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">{error}</p>
              <button
                onClick={load}
                className="mt-4 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3" style={{ opacity: 0.15 }}>◻</div>
              <p className="text-sm text-gray-500 font-medium mb-1">
                {articles.length === 0 ? "No articles yet" : "No articles match filters"}
              </p>
              {articles.length === 0 && (
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                  Import articles using the{" "}
                  <a href="/admin/import" className="text-orange-600 hover:underline">Import</a>{" "}
                  tool, or{" "}
                  <a href="/admin/articles/new" className="text-orange-600 hover:underline">create one manually</a>.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0ece8", background: "#faf9f6" }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">Img</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Section</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Author</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Media</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Pick</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ position: "sticky", right: 0, background: "#faf9f6", zIndex: 1 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, idx) => {
                    const sec = SECTIONS_DATA.find((s) => s.number === a.sectionNumber);
                    return (
                      <tr
                        key={a.id}
                        style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f5f3f0" : "none" }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Thumbnail */}
                        <td className="px-4 py-3">
                          <img
                            src={a.featuredImage || "/assets/images/common/img-fallback.png"}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            style={{ border: a.featuredImage ? "1px solid #f0ece8" : "1px dashed #fca99a" }}
                          />
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate" style={{ maxWidth: 260 }}>
                            {a.title}
                          </div>
                          {a.excerpt && (
                            <div className="text-xs text-gray-400 truncate mt-0.5" style={{ maxWidth: 260 }}>
                              {a.excerpt.slice(0, 80)}…
                            </div>
                          )}
                          <div className="text-xs text-gray-300 mt-0.5 font-mono">{a.displayId}</div>
                        </td>

                        {/* Section */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            {sec?.name ?? "—"}
                          </span>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            {a.authorImage ? (
                              <img
                                src={a.authorImage}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{ background: "#fef9f0", border: "1px dashed #fcd34d" }}
                                title="No author photo"
                              >
                                <span className="text-yellow-300 text-xs">?</span>
                              </div>
                            )}
                            <span className="text-sm text-gray-600 truncate" style={{ maxWidth: 130 }}>
                              {a.authorName || <span className="text-gray-300 italic">No name</span>}
                            </span>
                          </div>
                        </td>

                        {/* Media status */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="flex flex-col gap-1">
                            <ImageDot url={a.featuredImage} label="Cover" />
                            <ImageDot url={a.authorImage} label="Photo" />
                          </div>
                        </td>

                        {/* Status — dropdown selector */}
                        <td className="px-4 py-3">
                          {(() => {
                            const status = getStatus(a);
                            const cfg = {
                              published: { label: "Live",     dot: "#22c55e", bg: "#f0fdf4", color: "#15803d" },
                              draft:     { label: "Draft",    dot: "#9ca3af", bg: "#f9fafb", color: "#6b7280" },
                              archived:  { label: "Archived", dot: "#f59e0b", bg: "#fffbeb", color: "#b45309" },
                            }[status];
                            return (
                              <select
                                value={status}
                                onChange={(e) => setStatus(a, e.target.value as ArticleStatus)}
                                style={{
                                  background: cfg.bg,
                                  color: cfg.color,
                                  border: `1px solid ${cfg.dot}40`,
                                  borderRadius: 100,
                                  padding: "3px 10px 3px 8px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  outline: "none",
                                  appearance: "auto",
                                }}
                              >
                                <option value="published">● Live</option>
                                <option value="draft">○ Draft</option>
                                <option value="archived">◑ Archived</option>
                              </select>
                            );
                          })()}
                        </td>

                        {/* Editor's pick */}
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <button
                            onClick={() => toggleEditorsPick(a)}
                            title={a.isEditorsPick ? "Remove from editor's picks" : "Add to editor's picks"}
                            className="text-base transition-colors"
                            style={{ color: a.isEditorsPick ? "#f59e0b" : "#d1d5db" }}
                          >
                            ★
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right" style={{ position: "sticky", right: 0, background: "white", boxShadow: "-4px 0 8px rgba(0,0,0,0.04)" }}>
                          <div className="flex items-center justify-end gap-3">
                            <a
                              href={`/article/${a.slug || a.displayId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                              title="View on site"
                            >
                              View ↗
                            </a>
                            <a
                              href={`/admin/articles/${a.id}/edit`}
                              className="text-xs font-semibold hover:opacity-80 transition-opacity"
                              style={{ color: "#e8521d" }}
                            >
                              Edit
                            </a>
                            <button
                              onClick={() => handleDelete(a)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        {!loading && articles.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              Image present
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
              Missing — add via Edit
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
              Missing author photo
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}
