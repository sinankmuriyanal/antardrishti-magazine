import { notFound } from "next/navigation";
import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { getSectionBySlug } from "@/lib/sections";
import { SectionFeaturedCard, OverlayCard } from "@/components/public/ArticleCard";
import type { Metadata } from "next";
import type { Article } from "@/types";

export const revalidate = 3600;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const section = getSectionBySlug(slug);
  if (!section) return {};
  return { title: section.name, description: section.description };
}

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const section = getSectionBySlug(slug);
  if (!section) notFound();

  let articles: Article[] = [];
  try {
    const raw = await fetchArticles({ sectionNumber: section.number, published: true });
    // Edition 2 first, then newest publishedAt first
    articles = raw.sort((a, b) => {
      const edDiff = (b.edition ?? 1) - (a.edition ?? 1);
      if (edDiff !== 0) return edDiff;
      const ta = (b.publishedAt as { _seconds?: number; seconds?: number })?._seconds
        ?? (b.publishedAt as { _seconds?: number; seconds?: number })?.seconds ?? 0;
      const tb = (a.publishedAt as { _seconds?: number; seconds?: number })?._seconds
        ?? (a.publishedAt as { _seconds?: number; seconds?: number })?.seconds ?? 0;
      return ta - tb;
    });
  } catch { /* DB not configured */ }

  const [featured, ...rest] = articles;

  return (
    <>
      {/* ── Section hero ── */}
      <div className="section-page-hero panel py-6 lg:py-9">
        <div className="container max-w-xl">

          {/* Breadcrumb */}
          <ul
            className="breadcrumb nav-x gap-1 fs-7 m-0 mb-5"
            style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.03em" }}
          >
            <li>
              <a href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Home</a>
            </li>
            <li><i className="unicon-chevron-right" style={{ opacity: 0.25, fontSize: "0.65rem" }}></i></li>
            <li><span style={{ color: "rgba(255,255,255,0.65)" }}>Sections</span></li>
          </ul>

          {/* Section number */}
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Section {String(section.number).padStart(2, "0")}
          </div>

          {/* Section name */}
          <div className="hstack gap-4 items-center mb-2">
            <span
              style={{
                display: "block",
                width: "5px",
                height: "40px",
                background: "var(--color-primary)",
                borderRadius: "3px",
                flexShrink: 0,
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                color: "white",
                margin: 0,
              }}
            >
              {section.name}
            </h1>
          </div>

          {/* Description */}
          {section.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.5)",
                margin: "0.75rem 0 1.25rem",
                maxWidth: 520,
                marginLeft: "calc(5px + 1rem)",
              }}
            >
              {section.description}
            </p>
          )}

          {/* Count badge */}
          <div style={{ marginLeft: "calc(5px + 1rem)" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "4px 12px",
                borderRadius: "100px",
              }}
            >
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Articles ── */}
      <div className="section panel py-5 lg:py-7" style={{ background: "var(--color-warm-bg)" }}>
        <div className="container max-w-xl">
          {articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><i className="unicon-file-text"></i></div>
              <p className="empty-state__text">No articles in this section yet.</p>
              <a
                href="/"
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
                &larr; Back to Home
              </a>
            </div>
          ) : (
            <div className="vstack gap-6 lg:gap-8">

              {/* Featured first article */}
              {featured && (
                <SectionFeaturedCard article={featured} section={section} />
              )}

              {/* Remaining grid */}
              {rest.length > 0 && (
                <div>
                  <div className="mag-section-header">
                    <div className="mag-section-header__left">
                      <span className="mag-section-header__rule" />
                      <h2 className="mag-section-header__title">
                        More in {section.name}
                      </h2>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.68rem",
                        color: "var(--color-muted)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {rest.length} article{rest.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="row child-cols-12 md:child-cols-6 lg:child-cols-4 g-4">
                    {rest.map((a) => (
                      <div key={a.id}>
                        <OverlayCard article={a} section={section} ratio="ratio-4x3" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Section nav ── */}
      {articles.length > 0 && (
        <div style={{ background: "#fff", borderTop: "1px solid var(--color-border)", padding: "2rem 0" }}>
          <div className="container max-w-xl">
            <div className="hstack justify-between items-center">
              <a
                href="/"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--color-muted)",
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                &larr; Home
              </a>
              <a
                href="/all-articles"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                All Articles &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
