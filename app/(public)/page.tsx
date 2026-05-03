import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { adminDb } from "@/lib/firebase-admin";
import { getSectionByNumber } from "@/lib/sections";
import { HeroArticleCard, OverlayCard } from "@/components/public/ArticleCard";
import type { Article } from "@/types";

export const revalidate = 3600;

async function fetchHeroConfig(): Promise<{ featuredId: string | null; sidebarIds: string[] }> {
  try {
    const snap = await adminDb.collection("config").doc("heroConfig").get();
    if (snap.exists) return snap.data() as { featuredId: string | null; sidebarIds: string[] };
  } catch { /* not configured */ }
  return { featuredId: null, sidebarIds: [] };
}

function pubTs(a: Article): number {
  const t = a.publishedAt as { _seconds?: number; seconds?: number } | null;
  return t?._seconds ?? t?.seconds ?? 0;
}

export default async function HomePage() {
  let articles: Article[] = [];
  try {
    articles = await fetchArticles({ published: true });
  } catch { /* DB not configured */ }

  /* ── Hero config ───────────────────────────────────────────────────── */
  const heroConfig = await fetchHeroConfig();
  const byId = new Map(articles.map((a) => [a.id, a]));

  const featured: Article | undefined =
    (heroConfig.featuredId ? byId.get(heroConfig.featuredId) : undefined) ?? articles[0];

  const heroSidebar: Article[] = (heroConfig.sidebarIds.length > 0
    ? (heroConfig.sidebarIds.map((id) => byId.get(id)).filter(Boolean) as Article[])
    : articles.filter((a) => a.id !== featured?.id).slice(0, 2)
  ).slice(0, 2);

  const heroIds = new Set([featured?.id, ...heroSidebar.map((a) => a.id)].filter(Boolean) as string[]);

  /* ── Zone 2: Latest Reads (6 newest = 3×2, excluding hero) ────────── */
  const latestReads = articles
    .filter((a) => !heroIds.has(a.id))
    .sort((a, b) => {
      const edDiff = (b.edition ?? 1) - (a.edition ?? 1);
      if (edDiff !== 0) return edDiff;
      return pubTs(b) - pubTs(a);
    })
    .slice(0, 6);

  /* ── Zone 3: Most Popular (top 6 = 3×2 by totalViews, excl hero) ─── */
  const popularReads = articles
    .filter((a) => !heroIds.has(a.id))
    .sort((a, b) => ((b as Article & { totalViews?: number }).totalViews ?? 0) - ((a as Article & { totalViews?: number }).totalViews ?? 0))
    .filter((a) => ((a as Article & { totalViews?: number }).totalViews ?? 0) > 0)
    .slice(0, 6);

  if (articles.length === 0) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, opacity: 0.4, color: "var(--color-ink)" }}>
            No articles yet
          </p>
          <a href="/admin" className="btn btn-primary mt-4" style={{ borderRadius: "3px" }}>Go to Admin</a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ════════════════════════════════════════════════
          ZONE 1 — HERO  (admin-curated)
      ════════════════════════════════════════════════ */}
      <div className="section panel" style={{ background: "var(--color-warm-bg-2, #F4F2EF)", paddingTop: "1.75rem", paddingBottom: "1.75rem" }}>
        <div className="container max-w-xl">
          <div className="row g-3 col-match">
            {/* Main hero — landscape */}
            {featured && (
              <div className="col-12 lg:col-8">
                <HeroArticleCard article={featured} section={getSectionByNumber(featured.sectionNumber)!} />
              </div>
            )}
            {/* Sidebar — same OverlayCard style as the rest of the grid */}
            {heroSidebar.length > 0 && (
              <div className="col-12 lg:col-4">
                <div className="vstack gap-3 h-100">
                  {heroSidebar.map((a) => {
                    const sec = getSectionByNumber(a.sectionNumber);
                    return sec ? (
                      <div key={a.id} className="flex-fill" style={{ minHeight: 0 }}>
                        <OverlayCard article={a} section={sec} ratio="ratio-4x3" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ZONE 2 — LATEST READS
      ════════════════════════════════════════════════ */}
      {latestReads.length > 0 && (
        <div className="section panel py-6 lg:py-8" style={{ background: "var(--color-warm-bg, #FAF9F6)" }}>
          <div className="container max-w-xl">
            <div className="mag-section-header" style={{ marginBottom: "1.75rem" }}>
              <div className="mag-section-header__left">
                <span className="mag-section-header__rule" />
                <h2 className="mag-section-header__title">Latest Reads</h2>
              </div>
              <a href="/all-articles" className="mag-section-header__link">
                View all <i className="unicon-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </a>
            </div>
            {/* 3 columns × 2 rows */}
            <div className="row child-cols-12 sm:child-cols-6 lg:child-cols-4 g-4">
              {latestReads.map((a) => {
                const sec = getSectionByNumber(a.sectionNumber);
                return sec ? (
                  <div key={a.id}>
                    <OverlayCard article={a} section={sec} ratio="ratio-4x3" />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          ZONE 3 — MOST POPULAR
      ════════════════════════════════════════════════ */}
      {popularReads.length > 0 && (
        <div className="section panel py-6 lg:py-8" style={{ background: "var(--color-surface, #fff)" }}>
          <div className="container max-w-xl">
            <div className="mag-section-header" style={{ marginBottom: "1.75rem" }}>
              <div className="mag-section-header__left">
                <span className="mag-section-header__rule" />
                <h2 className="mag-section-header__title">Most Popular</h2>
              </div>
              <a href="/all-articles" className="mag-section-header__link">
                All articles <i className="unicon-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </a>
            </div>

            {/* 3 columns × 2 rows — same layout as Latest Reads, with views badge */}
            <div className="row child-cols-12 sm:child-cols-6 lg:child-cols-4 g-4">
              {popularReads.map((a) => {
                const sec = getSectionByNumber(a.sectionNumber);
                return sec ? (
                  <div key={a.id}>
                    <OverlayCard article={a} section={sec} ratio="ratio-4x3" showViews />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="cta-banner">
        <div className="container max-w-xl">
          <div className="row items-center">
            <div className="col-12 md:col-8">
              <p className="cta-banner__text">Explore the full collection</p>
              <p className="cta-banner__sub">{articles.length} articles across {new Set(articles.map((a) => a.sectionNumber)).size} sections</p>
            </div>
            <div className="col-12 md:col-4 text-md-end mt-3 md:mt-0">
              <a href="/all-articles" className="btn btn-primary"
                style={{ borderRadius: "3px", padding: "12px 28px", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                Browse All Articles
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
