import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { adminDb } from "@/lib/firebase-admin";
import { SECTIONS_DATA, getSectionByNumber } from "@/lib/sections";
import { HeroArticleCard, MiniOverlayCard, OverlayCard } from "@/components/public/ArticleCard";
import { absoluteImgUrl } from "@/lib/utils";
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

  /* ── Hero ─────────────────────────────────────────────────────────── */
  const heroConfig = await fetchHeroConfig();
  const byId = new Map(articles.map((a) => [a.id, a]));

  const featured: Article | undefined =
    (heroConfig.featuredId ? byId.get(heroConfig.featuredId) : undefined) ?? articles[0];

  const heroSidebar: Article[] = heroConfig.sidebarIds.length > 0
    ? (heroConfig.sidebarIds.map((id) => byId.get(id)).filter(Boolean) as Article[])
    : articles.filter((a) => a.id !== featured?.id).slice(0, 3);

  const heroIds = new Set([featured?.id, ...heroSidebar.map((a) => a.id)].filter(Boolean) as string[]);

  /* ── Zone 2: Latest Reads (8 newest, excluding hero) ─────────────── */
  const latestReads = articles
    .filter((a) => !heroIds.has(a.id))
    .sort((a, b) => {
      const edDiff = (b.edition ?? 1) - (a.edition ?? 1);
      if (edDiff !== 0) return edDiff;
      return pubTs(b) - pubTs(a);
    })
    .slice(0, 8);

  const latestIds = new Set(latestReads.map((a) => a.id));

  /* ── Zone 3: Explore Sections ────────────────────────────────────── */
  // One best article per section (Edition 2 preferred, then newest)
  const sectionCards = SECTIONS_DATA.map((sec) => {
    const secArticles = articles
      .filter((a) => a.sectionNumber === sec.number)
      .sort((a, b) => {
        const edDiff = (b.edition ?? 1) - (a.edition ?? 1);
        if (edDiff !== 0) return edDiff;
        return pubTs(b) - pubTs(a);
      });
    const count = secArticles.length;
    const pick = secArticles[0];
    return { section: sec, count, pick };
  }).filter((s) => s.count > 0);

  if (articles.length === 0) {
    return (
      <div className="section panel py-9" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          ZONE 1 — HERO
      ════════════════════════════════════════════════ */}
      <div className="section panel" style={{ background: "#fff", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="container max-w-xl">
          <div className="row g-3 col-match" style={{ minHeight: 500 }}>
            {featured && (
              <div className="col-12 lg:col-8" style={{ borderRadius: "10px", overflow: "hidden" }}>
                <HeroArticleCard article={featured} section={getSectionByNumber(featured.sectionNumber)!} />
              </div>
            )}
            {heroSidebar.length > 0 && (
              <div className="col-12 lg:col-4">
                <div className="vstack gap-3 h-100">
                  {heroSidebar.map((a) => (
                    <div key={a.id} className="flex-fill" style={{ minHeight: 0, borderRadius: "10px", overflow: "hidden" }}>
                      <MiniOverlayCard article={a} section={getSectionByNumber(a.sectionNumber)!} />
                    </div>
                  ))}
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
            {/* Section header */}
            <div className="mag-section-header" style={{ marginBottom: "1.75rem" }}>
              <div className="mag-section-header__left">
                <span className="mag-section-header__rule" />
                <h2 className="mag-section-header__title">Latest Reads</h2>
              </div>
              <a href="/all-articles" className="mag-section-header__link">
                View all <i className="unicon-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </a>
            </div>

            {/* 4-col grid — 2 rows of 4 */}
            <div className="row child-cols-12 sm:child-cols-6 md:child-cols-4 lg:child-cols-3 g-4">
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
          ZONE 3 — EXPLORE SECTIONS
      ════════════════════════════════════════════════ */}
      {sectionCards.length > 0 && (
        <div className="section panel py-6 lg:py-8" style={{ background: "#fff" }}>
          <div className="container max-w-xl">
            {/* Section header */}
            <div className="mag-section-header" style={{ marginBottom: "1.75rem" }}>
              <div className="mag-section-header__left">
                <span className="mag-section-header__rule" />
                <h2 className="mag-section-header__title">Explore Sections</h2>
              </div>
            </div>

            {/* Section cards grid */}
            <div className="row child-cols-12 sm:child-cols-6 lg:child-cols-3 g-4">
              {sectionCards.map(({ section, count, pick }) => {
                const img = absoluteImgUrl(pick?.featuredImage) ?? "/assets/images/common/img-fallback.png";
                return (
                  <div key={section.id}>
                    <a
                      href={`/section/${section.slug}`}
                      style={{ display: "block", textDecoration: "none" }}
                      className="section-explore-card"
                    >
                      <div style={{
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid var(--color-border, #E2DDD8)",
                        background: "white",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}>
                        {/* Image */}
                        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                          <img
                            src={img}
                            alt={section.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            className="uc-transition-scale-up"
                          />
                          {/* Dark overlay */}
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to top, rgba(10,14,20,0.75) 0%, rgba(10,14,20,0.1) 60%, transparent 100%)",
                          }} />
                          {/* Section number */}
                          <span style={{
                            position: "absolute", top: 10, left: 10,
                            fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 700,
                            letterSpacing: "0.12em", textTransform: "uppercase",
                            color: "rgba(255,255,255,0.55)",
                            background: "rgba(10,14,20,0.45)", backdropFilter: "blur(4px)",
                            padding: "3px 8px", borderRadius: 100,
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}>
                            Section {String(section.number).padStart(2, "0")}
                          </span>
                        </div>

                        {/* Text */}
                        <div style={{ padding: "1rem 1.1rem 1.1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <h3 style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "var(--color-text, #111318)",
                            margin: 0,
                            letterSpacing: "-0.01em",
                          }}>
                            {section.name}
                          </h3>
                          {section.description && (
                            <p style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.78rem",
                              lineHeight: 1.55,
                              color: "var(--color-muted)",
                              margin: 0,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>
                              {section.description}
                            </p>
                          )}
                          <div style={{
                            marginTop: "auto",
                            paddingTop: "0.6rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}>
                            <span style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.68rem",
                              color: "var(--color-muted)",
                            }}>
                              {count} article{count !== 1 ? "s" : ""}
                            </span>
                            <span style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "var(--color-primary)",
                              letterSpacing: "0.04em",
                            }}>
                              Read more &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Browse all CTA ── */}
      <div className="cta-banner">
        <div className="container max-w-xl">
          <div className="row items-center">
            <div className="col-12 md:col-8">
              <p className="cta-banner__text">Explore the full collection</p>
              <p className="cta-banner__sub">{articles.length} articles across {sectionCards.length} sections</p>
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
