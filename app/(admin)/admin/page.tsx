"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { SECTIONS_DATA } from "@/lib/sections";
import type { Article } from "@/types";

interface DashStats {
  total: number;
  published: number;
  drafts: number;
  editorsPicks: number;
  pendingComments: number;
  missingCover: number;
  missingAuthorPhoto: number;
  sectionCoverage: { name: string; count: number; slug: string }[];
  recentArticles: { id: string; title: string; displayId: string; slug?: string; sectionName: string; isPublished: boolean; authorName?: string }[];
  missingArticles: { id: string; title: string; displayId: string; slug?: string; missingCover: boolean; missingPhoto: boolean }[];
}

const EMPTY: DashStats = {
  total: 0, published: 0, drafts: 0, editorsPicks: 0, pendingComments: 0,
  missingCover: 0, missingAuthorPhoto: 0, sectionCoverage: [], recentArticles: [], missingArticles: [],
};

function KPICard({ label, value, sub, href, accent = "#e8521d", loading }: {
  label: string; value: number | string; sub?: string; href: string; accent?: string; loading: boolean;
}) {
  return (
    <a href={href} className="block bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group" style={{ borderColor: "#f0ece8" }}>
      <div className="text-3xl font-bold mb-1 transition-colors group-hover:text-orange-600" style={{ color: loading ? "#e5e7eb" : accent, fontVariantNumeric: "tabular-nums" }}>
        {loading ? "—" : value}
      </div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </a>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [articles, allComments] = await Promise.all([
          fetch("/api/articles").then((r) => r.json() as Promise<Article[]>),
          fetch("/api/comments").then((r) => r.json() as Promise<{ isApproved: boolean }[]>),
        ]);

        const sectionMap: Record<number, string> = {};
        SECTIONS_DATA.forEach((s) => { sectionMap[s.number] = s.name; });

        const sectionCount: Record<number, number> = {};
        articles.forEach((a) => { sectionCount[a.sectionNumber] = (sectionCount[a.sectionNumber] ?? 0) + 1; });

        const recent = [...articles]
          .sort((a, b) => {
            const ta = (a.updatedAt as { _seconds?: number; seconds?: number })?._seconds
              ?? (a.updatedAt as { _seconds?: number; seconds?: number })?.seconds ?? 0;
            const tb = (b.updatedAt as { _seconds?: number; seconds?: number })?._seconds
              ?? (b.updatedAt as { _seconds?: number; seconds?: number })?.seconds ?? 0;
            return tb - ta;
          })
          .slice(0, 8)
          .map((a) => ({
            id: a.id,
            title: a.title,
            displayId: a.displayId,
            slug: a.slug,
            sectionName: sectionMap[a.sectionNumber] ?? "—",
            isPublished: a.isPublished,
            authorName: a.authorName,
          }));

        setStats({
          total: articles.length,
          published: articles.filter((a) => a.isPublished).length,
          drafts: articles.filter((a) => !a.isPublished).length,
          editorsPicks: articles.filter((a) => a.isEditorsPick).length,
          pendingComments: allComments.filter((c) => !c.isApproved).length,
          missingCover: articles.filter((a) => !a.featuredImage).length,
          missingAuthorPhoto: articles.filter((a) => !a.authorImage).length,
          sectionCoverage: SECTIONS_DATA.map((s) => ({
            name: s.name, count: sectionCount[s.number] ?? 0, slug: s.slug,
          })),
          recentArticles: recent,
          missingArticles: articles
            .filter((a) => !a.featuredImage || !a.authorImage)
            .map((a) => ({
              id: a.id, title: a.title, displayId: a.displayId, slug: a.slug,
              missingCover: !a.featuredImage, missingPhoto: !a.authorImage,
            })),
        });
      } catch { /* DB not configured */ }
      setLoading(false);
    }
    load();
  }, []);

  const maxSectionCount = Math.max(...stats.sectionCoverage.map((s) => s.count), 1);

  return (
    <AdminShell>
      <div className="max-w-5xl space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Antardrishti — Content overview</p>
          </div>
          <a
            href="/admin/articles/new"
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "#e8521d" }}
          >
            <span className="text-base leading-none">+</span> Write article
          </a>
        </div>

        {/* KPI row 1 — content volume */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Content</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Total articles" value={stats.total} sub={`${stats.published} live · ${stats.drafts} draft`} href="/admin/articles" loading={loading} />
            <KPICard label="Published" value={stats.published} sub="visible to readers" href="/admin/articles" accent="#16a34a" loading={loading} />
            <KPICard label="Editor's picks" value={stats.editorsPicks} sub="featured articles" href="/admin/articles" accent="#f59e0b" loading={loading} />
            <KPICard label="Drafts" value={stats.drafts} sub="not yet published" href="/admin/articles" accent="#6b7280" loading={loading} />
          </div>
        </div>

        {/* KPI row 2 — health */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Content health</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KPICard
              label="Pending comments"
              value={stats.pendingComments}
              sub={stats.pendingComments > 0 ? "need your review" : "inbox clear"}
              href="/admin/comments"
              accent={stats.pendingComments > 0 ? "#2563eb" : "#16a34a"}
              loading={loading}
            />
            <KPICard
              label="Missing cover"
              value={stats.missingCover}
              sub="articles need images"
              href="/admin/articles"
              accent={stats.missingCover > 0 ? "#dc2626" : "#16a34a"}
              loading={loading}
            />
            <KPICard
              label="Missing author photo"
              value={stats.missingAuthorPhoto}
              sub="authors need photos"
              href="/admin/articles"
              accent={stats.missingAuthorPhoto > 0 ? "#d97706" : "#16a34a"}
              loading={loading}
            />
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Recent articles — wider */}
          <div className="lg:col-span-3 bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f5f3f0" }}>
              <h2 className="text-sm font-semibold text-gray-900">Recently updated</h2>
              <a href="/admin/articles" className="text-xs font-semibold hover:opacity-80" style={{ color: "#e8521d" }}>
                View all →
              </a>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : stats.recentArticles.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No articles yet</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#f5f3f0" }}>
                {stats.recentArticles.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <span
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ background: a.isPublished ? "#22c55e" : "#d1d5db" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 truncate">{a.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {a.sectionName}
                        {a.authorName && <> · {a.authorName}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`/article/${a.slug || a.displayId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-300 hover:text-gray-500"
                      >
                        ↗
                      </a>
                      <a
                        href={`/admin/articles/${a.id}/edit`}
                        className="text-xs font-semibold hover:opacity-70"
                        style={{ color: "#e8521d" }}
                      >
                        Edit
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section coverage — narrower */}
          <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#f5f3f0" }}>
              <h2 className="text-sm font-semibold text-gray-900">Sections</h2>
              <p className="text-xs text-gray-400 mt-0.5">Articles per section</p>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {stats.sectionCoverage.map((s) => (
                  <a key={s.slug} href={`/section/${s.slug}`} target="_blank" rel="noreferrer" className="block group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 group-hover:text-orange-600 transition-colors">{s.name}</span>
                      <span className="text-xs font-bold text-gray-500">{s.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f5f3f0" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((s.count / maxSectionCount) * 100)}%`,
                          background: s.count > 0 ? "#e8521d" : "#e5e7eb",
                          minWidth: s.count > 0 ? "8px" : 0,
                        }}
                      />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content health — missing images */}
        {!loading && stats.missingArticles.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f5f3f0" }}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Articles missing images</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {stats.missingArticles.length} article{stats.missingArticles.length !== 1 ? "s" : ""} need attention
                </p>
              </div>
              <a href="/admin/articles" className="text-xs font-semibold hover:opacity-80" style={{ color: "#e8521d" }}>
                View all →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr style={{ background: "#faf9f6", borderBottom: "1px solid #f5f3f0" }}>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Article</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cover</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.missingArticles.map((a, i) => (
                    <tr key={a.id} style={{ borderTop: i > 0 ? "1px solid #f5f3f0" : "none" }} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800 truncate" style={{ maxWidth: 260 }}>{a.title}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: a.missingCover ? "#ef4444" : "#22c55e" }} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: a.missingPhoto ? "#f59e0b" : "#22c55e" }} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a href={`/admin/articles/${a.id}/edit`} className="text-xs font-semibold hover:opacity-70" style={{ color: "#e8521d" }}>
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

        {!loading && stats.missingArticles.length === 0 && stats.total > 0 && (
          <div className="rounded-xl border px-5 py-4 flex items-center gap-3" style={{ borderColor: "#d1fae5", background: "#f0fdf4" }}>
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
