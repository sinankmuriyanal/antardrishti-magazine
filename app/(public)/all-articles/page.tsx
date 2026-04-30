import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { getSectionByNumber, SECTIONS_DATA } from "@/lib/sections";
import { OverlayCard } from "@/components/public/ArticleCard";
import type { Metadata } from "next";
import type { Article } from "@/types";

export const metadata: Metadata = {
  title: "All Articles",
  description: "Browse every article from Antardrishti across all sections.",
};
export const revalidate = 3600;

export default async function AllArticlesPage({ searchParams }: { searchParams: Promise<{ section?: string; q?: string }> }) {
  const { section: sectionFilter, q: query } = await searchParams;

  let articles: Article[] = [];
  try {
    const opts = sectionFilter ? { sectionNumber: parseInt(sectionFilter), published: true } : { published: true };
    articles = await fetchArticles(opts);
  } catch { /* DB not configured */ }

  // Client-side search filter (basic title/excerpt match)
  const filtered = query
    ? articles.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        (a.excerpt ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : articles;

  const activeSection = sectionFilter
    ? SECTIONS_DATA.find((s) => String(s.number) === sectionFilter)
    : null;

  return (
    <>
      {/* ── Header ── */}
      <div className="section-page-hero panel py-6 lg:py-9">
        <div className="container max-w-xl">

          {/* Breadcrumb */}
          <ul
            className="breadcrumb nav-x gap-1 m-0 mb-5"
            style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem" }}
          >
            <li>
              <a href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Home</a>
            </li>
            <li><i className="unicon-chevron-right" style={{ opacity: 0.25, fontSize: "0.65rem" }}></i></li>
            <li>
              <span style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-body)" }}>
                All Articles
              </span>
            </li>
          </ul>

          <div className="hstack gap-4 items-center mb-3">
            <span
              style={{
                display: "block",
                width: "5px",
                height: "36px",
                background: "var(--color-primary)",
                borderRadius: "3px",
                flexShrink: 0,
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "white",
                margin: 0,
              }}
            >
              {activeSection ? activeSection.name : "All Articles"}
            </h1>
          </div>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.88rem",
              color: "rgba(255,255,255,0.4)",
              margin: "0 0 0 calc(5px + 1rem)",
            }}
          >
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            {activeSection ? ` in ${activeSection.name}` : " across all sections"}
            {query ? ` matching "${query}"` : ""}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="section panel py-5 lg:py-7" style={{ background: "var(--color-warm-bg)" }}>
        <div className="container max-w-xl">

          {/* Section filter pills */}
          <div className="panel mb-5" style={{ overflowX: "auto", paddingBottom: "4px" }}>
            <div className="hstack gap-2 flex-nowrap">
              <a
                href="/all-articles"
                className={`filter-pill${!sectionFilter ? " active" : ""}`}
              >
                All
              </a>
              {SECTIONS_DATA.map((s) => {
                const isActive = sectionFilter === String(s.number);
                return (
                  <a
                    key={s.id}
                    href={`/all-articles?section=${s.number}`}
                    className={`filter-pill${isActive ? " active" : ""}`}
                  >
                    {s.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Articles grid */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><i className="unicon-file-text"></i></div>
              <p className="empty-state__text">
                {query ? `No articles found for "${query}"` : "No articles found."}
              </p>
              {(sectionFilter || query) && (
                <a
                  href="/all-articles"
                  style={{
                    display: "inline-block",
                    marginTop: "1rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--color-primary)",
                    textDecoration: "none",
                  }}
                >
                  Clear filters
                </a>
              )}
            </div>
          ) : (
            <div className="row child-cols-12 md:child-cols-6 lg:child-cols-4 g-4">
              {filtered.map((a) => {
                const sec = getSectionByNumber(a.sectionNumber);
                return sec ? (
                  <div key={a.id}>
                    <OverlayCard article={a} section={sec} ratio="ratio-4x3" />
                  </div>
                ) : null;
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
