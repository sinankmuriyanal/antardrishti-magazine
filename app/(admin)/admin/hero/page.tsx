"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import type { Article } from "@/types";

interface HeroConfig { featuredId: string | null; sidebarIds: string[] }

export default function HeroAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [config, setConfig] = useState<HeroConfig>({ featuredId: null, sidebarIds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/articles").then((r) => r.json() as Promise<Article[]>),
      fetch("/api/hero").then((r) => r.json() as Promise<HeroConfig>),
    ]).then(([arts, cfg]) => {
      setArticles(arts.filter((a) => a.isPublished));
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const filtered = articles.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.authorName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function setFeatured(id: string) {
    setConfig((c) => ({
      featuredId: c.featuredId === id ? null : id,
      sidebarIds: c.sidebarIds.filter((x) => x !== id),
    }));
  }

  function toggleSidebar(id: string) {
    setConfig((c) => {
      if (c.featuredId === id) return c; // can't add featured to sidebar
      const has = c.sidebarIds.includes(id);
      return {
        ...c,
        sidebarIds: has
          ? c.sidebarIds.filter((x) => x !== id)
          : c.sidebarIds.length < 3 ? [...c.sidebarIds, id] : c.sidebarIds,
      };
    });
  }

  async function handleSave() {
    setSaving(true); setSaved(false);
    await fetch("/api/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const featuredArticle = articles.find((a) => a.id === config.featuredId);
  const sidebarArticles = config.sidebarIds.map((id) => articles.find((a) => a.id === id)).filter(Boolean) as Article[];

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hero Section</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Pick 1 featured article + up to 3 sidebar articles shown in the homepage hero block.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
            style={{ background: saved ? "#16a34a" : "#e8521d" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save selection"}
          </button>
        </div>

        {/* Current selection preview */}
        <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: "#f0ece8" }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current hero selection</p>
          <div className="flex gap-4 flex-wrap">
            {/* Featured */}
            <div style={{ flex: "0 0 auto", width: 200 }}>
              <p className="text-xs text-gray-400 mb-1.5">Featured (large)</p>
              {featuredArticle ? (
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#e8521d" }}>
                  {featuredArticle.featuredImage && (
                    <img src={featuredArticle.featuredImage} alt="" className="w-full object-cover" style={{ height: 80 }} />
                  )}
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2">{featuredArticle.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{featuredArticle.authorName}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-400">None selected</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <p className="text-xs text-gray-400 mb-1.5">Sidebar mini cards ({sidebarArticles.length}/3)</p>
              <div className="flex flex-col gap-2">
                {sidebarArticles.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#f0ece8" }}>
                    {a.featuredImage && (
                      <img src={a.featuredImage} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    )}
                    <p className="text-xs font-medium text-gray-700 line-clamp-2 flex-1">{a.title}</p>
                  </div>
                ))}
                {sidebarArticles.length === 0 && (
                  <p className="text-xs text-gray-400 italic">None selected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Article picker */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#f0ece8" }}>
            <p className="text-sm font-semibold text-gray-900 flex-1">All published articles</p>
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
            />
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f5f3f0" }}>
              {filtered.map((a) => {
                const isFeatured = config.featuredId === a.id;
                const sidebarIdx = config.sidebarIds.indexOf(a.id);
                const isSidebar = sidebarIdx !== -1;
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    {/* Thumbnail */}
                    <img
                      src={a.featuredImage || "/assets/images/common/img-fallback.png"}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 truncate">{a.authorName} · {a.displayId}</p>
                    </div>
                    {/* Status badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isFeatured && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fef3f0", color: "#e8521d" }}>
                          Featured
                        </span>
                      )}
                      {isSidebar && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#eff6ff", color: "#2563eb" }}>
                          Sidebar {sidebarIdx + 1}
                        </span>
                      )}
                    </div>
                    {/* Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setFeatured(a.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                        style={isFeatured
                          ? { background: "#fef3f0", color: "#e8521d", borderColor: "#e8521d" }
                          : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }}
                      >
                        {isFeatured ? "★ Featured" : "Set featured"}
                      </button>
                      <button
                        onClick={() => toggleSidebar(a.id)}
                        disabled={!isSidebar && config.sidebarIds.length >= 3}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
                        style={isSidebar
                          ? { background: "#eff6ff", color: "#2563eb", borderColor: "#2563eb" }
                          : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }}
                      >
                        {isSidebar ? "✓ Sidebar" : "Add sidebar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
