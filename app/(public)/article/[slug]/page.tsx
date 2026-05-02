import { notFound } from "next/navigation";
import { fetchArticleBySlugServer, fetchArticleByDisplayIdServer } from "@/lib/articles-server";
import { getSectionByNumber } from "@/lib/sections";
import { CommentSection } from "@/components/public/CommentSection";
import { absoluteImgUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 60;

const FALLBACK = "/assets/images/common/img-fallback.png";

function sanitizeContentHtml(html: string): string {
  return html
    .replace(/\s+data-uc-lightbox(?:="[^"]*")?/g, "")
    .replace(/\s+data-uc-img(?:="[^"]*")?/g, "")
    .replace(/\s+data-uc-svg(?:="[^"]*")?/g, "")
    .replace(/ (src|data-src)="assets\//g, ' $1="/assets/');
}

interface Props { params: Promise<{ slug: string }> }

async function resolveArticle(slug: string) {
  const bySlug = await fetchArticleBySlugServer(slug);
  if (bySlug) return bySlug;
  return fetchArticleByDisplayIdServer(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await resolveArticle(slug);
    if (!article) return {};
    return {
      title: article.title,
      description: article.excerpt,
      openGraph: {
        title: article.title,
        description: article.excerpt,
        images: article.featuredImage ? [article.featuredImage] : [],
      },
    };
  } catch { return {}; }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  let article = null;
  try {
    article = await resolveArticle(slug);
  } catch { /* DB not configured */ }

  if (!article) notFound();

  const section = getSectionByNumber(article.sectionNumber);

  const ts = article.publishedAt as unknown as { seconds?: number; _seconds?: number } | null;
  const epochMs = ts ? ((ts.seconds ?? ts._seconds ?? 0) * 1000) : 0;
  const publishedDate = epochMs
    ? new Date(epochMs).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const shareUrl = `/article/${article.slug || article.displayId}`;

  const coverImg = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
  const authorImgUrl = absoluteImgUrl(article.authorImage);

  return (
    <>
      {/* ── Dark header block — full dark bg covers breadcrumb + header + image ── */}
      <div style={{ background: "var(--color-ink, #0F1923)" }}>

        {/* Breadcrumb */}
        <div className="breadcrumb-bar">
          <div className="container max-w-xl">
            <ul className="breadcrumb nav-x gap-1 m-0">
              <li>
                <a href="/" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
                  Home
                </a>
              </li>
              <li><i className="unicon-chevron-right" style={{ opacity: 0.3, fontSize: "0.65rem" }}></i></li>
              {section && (
                <>
                  <li>
                    <a href={`/section/${section.slug}`} style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
                      {section.name}
                    </a>
                  </li>
                  <li><i className="unicon-chevron-right" style={{ opacity: 0.3, fontSize: "0.65rem" }}></i></li>
                </>
              )}
              <li>
                <span style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-body)" }} className="text-truncate">
                  {article.title}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Article header */}
        <div className="container max-w-xl">
          <div className="panel vstack gap-3 md:gap-4" style={{ paddingTop: "2.5rem", paddingBottom: "1.5rem", alignItems: "center", textAlign: "center" }}>

            {/* Section badge */}
            {section && (
              <div>
                <a href={`/section/${section.slug}`} style={{ textDecoration: "none" }}>
                  <span style={{
                    display: "inline-block",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--color-primary)",
                    border: "1px solid var(--color-primary)",
                    padding: "3px 12px",
                    borderRadius: "2px",
                  }}>
                    {section.name}
                  </span>
                </a>
              </div>
            )}

            {/* Title */}
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
                fontWeight: 700,
                lineHeight: 1.18,
                letterSpacing: "-0.03em",
                color: "white",
                margin: 0,
              }}>
                {article.title}
              </h1>
            </div>

            {/* Meta row */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginTop: "0.25rem" }}>
              {authorImgUrl && (
                <img
                  src={authorImgUrl}
                  alt={article.authorName || ""}
                  loading="eager"
                  style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }}
                />
              )}
              <div className="vstack gap-0" style={{ textAlign: "left" }}>
                {article.authorName && (
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.88rem", color: "rgba(255,255,255,0.8)" }}>
                    {article.authorName}
                  </span>
                )}
                {publishedDate && (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    {publishedDate}
                  </span>
                )}
              </div>
              {article.readingTime && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.9rem" }}>&middot;</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>
                    {article.readingTime} min read
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Featured image — inside dark block so it sits on the ink bg */}
        <div className="container max-w-xl" style={{ paddingBottom: "2.5rem" }}>
          <div style={{ borderRadius: "14px", overflow: "hidden", aspectRatio: "16/9", maxHeight: 520, width: "100%" }}>
            <img
              src={coverImg}
              alt={article.title}
              loading="eager"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>

      </div>
      {/* ── End dark header block ── */}

      {/* ── Article body (light background) ── */}
      <article className="post type-post single-post">
        <div className="panel py-5 lg:py-7">
          <div className="container max-w-lg">

            <div
              className="post-content panel"
              dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(article.content) }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="hstack gap-2 flex-wrap mt-5">
                {article.tags.map((tag) => (
                  <span key={tag} style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "var(--color-muted)",
                    background: "var(--color-warm-bg, #faf9f6)",
                    border: "1px solid var(--color-border, #e2ddd8)",
                    padding: "4px 10px",
                    borderRadius: "3px",
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share bar */}
            <div className="panel vstack sm:hstack gap-3 justify-between py-5 mt-5" style={{ borderTop: "1px solid var(--color-border)" }}>
              <div className="hstack gap-2 items-center">
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", marginRight: "4px" }}>
                  Share
                </span>
                <a className="share-btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn">
                  <i className="unicon-logo-linkedin icon-1"></i>
                </a>
                <a className="share-btn" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" aria-label="Share on X">
                  <i className="unicon-logo-x-filled icon-1"></i>
                </a>
                <a className="share-btn" href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(shareUrl)}`} aria-label="Share by Email">
                  <i className="unicon-email icon-1"></i>
                </a>
              </div>
              <div className="hstack gap-2 items-center">
                {section && (
                  <a href={`/section/${section.slug}`} style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-primary)", textDecoration: "none" }}>
                    More in {section.name} &rarr;
                  </a>
                )}
              </div>
            </div>

            {/* Author bio */}
            {article.authorName && (
              <div className="author-bio-card mt-2 mb-5">
                <div className="row g-4 items-center">
                  {authorImgUrl && (
                    <div className="col-12 sm:col-auto">
                      <figure className="m-0 overflow-hidden" style={{ width: 90, height: 90, borderRadius: "50%", flexShrink: 0 }}>
                        <img
                          src={authorImgUrl}
                          alt={article.authorName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </figure>
                    </div>
                  )}
                  <div className="col">
                    <div className="vstack gap-2">
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: "4px" }}>
                          Written by
                        </div>
                        <h4 className="author-name">{article.authorName}</h4>
                      </div>
                      {article.authorBio && <p className="author-bio-text">{article.authorBio}</p>}
                      {article.authorLinkedIn && (
                        <a href={article.authorLinkedIn} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                          <i className="icon-2 unicon-logo-linkedin"></i>
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <CommentSection articleId={article.id} />

          </div>
        </div>
      </article>
    </>
  );
}
