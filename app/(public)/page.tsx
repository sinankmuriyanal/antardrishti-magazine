import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { adminDb } from "@/lib/firebase-admin";
import { SECTIONS_DATA, getSectionByNumber } from "@/lib/sections";
import { HeroArticleCard, MiniOverlayCard, OverlayCard } from "@/components/public/ArticleCard";
import type { Article } from "@/types";

export const revalidate = 3600;

async function fetchHeroConfig(): Promise<{ featuredId: string | null; sidebarIds: string[] }> {
  try {
    const snap = await adminDb.collection("config").doc("heroConfig").get();
    if (snap.exists) return snap.data() as { featuredId: string | null; sidebarIds: string[] };
  } catch { /* not configured */ }
  return { featuredId: null, sidebarIds: [] };
}

export default async function HomePage() {
  let articles: Article[] = [];
  try {
    articles = await fetchArticles({ published: true });
  } catch {
    // DB not configured — show empty state
  }

  // Use curated hero config if set, otherwise fall back to auto-sorted first articles
  const heroConfig = await fetchHeroConfig();
  const byId = new Map(articles.map((a) => [a.id, a]));

  const featured: Article | undefined =
    (heroConfig.featuredId ? byId.get(heroConfig.featuredId) : undefined) ?? articles[0];

  const heroSidebar: Article[] = heroConfig.sidebarIds.length > 0
    ? heroConfig.sidebarIds.map((id) => byId.get(id)).filter(Boolean) as Article[]
    : articles.filter((a) => a.id !== featured?.id).slice(0, 3);

  // IDs already shown in the hero block — never repeat them in section rows
  const heroIds = new Set([featured?.id, ...heroSidebar.map((a) => a.id)].filter(Boolean));

  // Per-section: Edition 2 first, then newest first, exclude hero articles, show up to 3
  const sectionGroups = SECTIONS_DATA.map((sec) => {
    const sectionArticles = articles
      .filter((a) => a.sectionNumber === sec.number && !heroIds.has(a.id))
      .sort((a, b) => {
        const edDiff = (b.edition ?? 1) - (a.edition ?? 1);
        if (edDiff !== 0) return edDiff;
        const ta = (b.publishedAt as { _seconds?: number; seconds?: number })?._seconds
          ?? (b.publishedAt as { _seconds?: number; seconds?: number })?.seconds ?? 0;
        const tb = (a.publishedAt as { _seconds?: number; seconds?: number })?._seconds
          ?? (a.publishedAt as { _seconds?: number; seconds?: number })?.seconds ?? 0;
        return ta - tb;
      })
      .slice(0, 3);
    return { section: sec, articles: sectionArticles };
  }).filter((g) => g.articles.length > 0);

  return (
    <>
      {/* ── Hero ── */}
      <div className="section panel" style={{ background: "#fff", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="container max-w-xl">
          {articles.length === 0 ? (
            <div className="panel py-9 text-center" style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ marginBottom: "1rem", opacity: 0.2 }}>
                <i className="unicon-file-text icon-5 text-white"></i>
              </div>
              <h2
                className="m-0 text-white"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600, opacity: 0.5, fontSize: "1.4rem" }}
              >
                No articles yet
              </h2>
              <p
                className="mt-2 text-white"
                style={{ fontFamily: "var(--font-body)", opacity: 0.35, fontSize: "0.9rem" }}
              >
                Run the import scripts to populate the magazine.
              </p>
              <a
                href="/admin"
                className="btn btn-primary mt-4"
                style={{ borderRadius: "3px", fontWeight: 600, letterSpacing: "0.05em" }}
              >
                Go to Admin
              </a>
            </div>
          ) : (
            <div className="row g-3 col-match" style={{ minHeight: 500 }}>
              {/* Main hero */}
              {featured && (
                <div className="col-12 lg:col-8" style={{ borderRadius: "10px", overflow: "hidden" }}>
                  <HeroArticleCard
                    article={featured}
                    section={getSectionByNumber(featured.sectionNumber)!}
                  />
                </div>
              )}
              {/* Sidebar stack */}
              {heroSidebar.length > 0 && (
                <div className="col-12 lg:col-4">
                  <div className="vstack gap-3 h-100">
                    {heroSidebar.map((a) => (
                      <div key={a.id} className="flex-fill" style={{ minHeight: 0, borderRadius: "10px", overflow: "hidden" }}>
                        <MiniOverlayCard
                          article={a}
                          section={getSectionByNumber(a.sectionNumber)!}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Edition badge strip ── */}
      {articles.length > 0 && (
        <div style={{ background: "var(--color-primary)", padding: "10px 0" }}>
          <div className="container max-w-xl">
            <div className="hstack justify-between items-center">
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
              }}>
                Antardrishti &mdash; 2nd Edition
              </span>
              <a
                href="/all-articles"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.8)",
                  textDecoration: "none",
                }}
              >
                All Articles &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Section rows ── */}
      {sectionGroups.map(({ section, articles: sArticles }, idx) => (
        <div
          key={section.id}
          className="section panel py-5 lg:py-7"
          style={{ background: idx % 2 === 0 ? "#fff" : "var(--color-warm-bg, #FAF9F6)" }}
        >
          <div className="container max-w-xl">
            {/* Section header */}
            <div className="mag-section-header">
              <div className="mag-section-header__left">
                <span className="mag-section-header__rule" />
                <h2 className="mag-section-header__title">
                  <a href={`/section/${section.slug}`} className="text-none text-dark dark:text-white">
                    {section.name}
                  </a>
                </h2>
              </div>
              <a href={`/section/${section.slug}`} className="mag-section-header__link">
                View all <i className="unicon-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </a>
            </div>

            {/* Cards grid */}
            <div className="row child-cols-12 md:child-cols-4 g-4">
              {sArticles.map((a) => (
                <div key={a.id}>
                  <OverlayCard article={a} section={section} ratio="ratio-4x3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ── Browse all CTA ── */}
      {articles.length > 0 && (
        <div className="cta-banner">
          <div className="container max-w-xl">
            <div className="row items-center">
              <div className="col-12 md:col-8">
                <p className="cta-banner__text">
                  Explore the full collection
                </p>
                <p className="cta-banner__sub">
                  {articles.length} articles across {sectionGroups.length} sections
                </p>
              </div>
              <div className="col-12 md:col-4 text-md-end mt-3 md:mt-0">
                <a
                  href="/all-articles"
                  className="btn btn-primary"
                  style={{ borderRadius: "3px", padding: "12px 28px", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em" }}
                >
                  Browse All Articles
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
