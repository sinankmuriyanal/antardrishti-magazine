import { notFound } from "next/navigation";
import { fetchArticleByDisplayIdServer as fetchArticleByDisplayId } from "@/lib/articles-server";
import { getSectionByNumber } from "@/lib/sections";
import { CommentSection } from "@/components/public/CommentSection";
import type { Metadata } from "next";

export const revalidate = 3600;

interface Props { params: Promise<{ displayId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { displayId } = await params;
  try {
    const article = await fetchArticleByDisplayId(displayId);
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
  const { displayId } = await params;

  let article = null;
  try {
    article = await fetchArticleByDisplayId(displayId);
  } catch { /* DB not configured */ }

  if (!article) notFound();

  const section = getSectionByNumber(article.sectionNumber);

  const publishedDate = article.publishedAt
    ? new Date((article.publishedAt as unknown as { seconds: number }).seconds * 1000)
        .toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const shareUrl = `/article/${article.displayId}`;

  return (
    <>
      {/* ── Breadcrumb bar ── */}
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
                  <a
                    href={`/section/${section.slug}`}
                    style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontFamily: "var(--font-body)" }}
                  >
                    {section.name}
                  </a>
                </li>
                <li><i className="unicon-chevron-right" style={{ opacity: 0.3, fontSize: "0.65rem" }}></i></li>
              </>
            )}
            <li>
              <span
                style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-body)" }}
                className="text-truncate"
              >
                {article.displayId}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Dark header bg ── */}
      <div
        className="position-absolute top-0 start-0 end-0"
        style={{ minHeight: "52px", background: "var(--color-ink)", zIndex: 0 }}
      />

      <article className="post type-post single-post py-4 lg:py-6 xl:py-9">

        {/* ── Article header ── */}
        <div className="container max-w-xl" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="panel vstack gap-3 md:gap-4 text-center"
            style={{ paddingTop: "2rem", paddingBottom: "1.5rem" }}
          >
            {/* Section badge */}
            {section && (
              <div>
                <a
                  href={`/section/${section.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <span
                    style={{
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
                    }}
                  >
                    {section.name}
                  </span>
                </a>
              </div>
            )}

            {/* Title */}
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
                  fontWeight: 700,
                  lineHeight: 1.18,
                  letterSpacing: "-0.03em",
                  color: "white",
                  margin: 0,
                }}
              >
                {article.title}
              </h1>
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.05rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.55)",
                  maxWidth: 580,
                  margin: "0 auto",
                }}
              >
                {article.excerpt}
              </p>
            )}

            {/* Meta row */}
            <div className="hstack gap-3 justify-center items-center flex-wrap" style={{ marginTop: "0.5rem" }}>
              {article.authorImage && (
                <img
                  src={article.authorImage}
                  alt={article.authorName || ""}
                  style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }}
                />
              )}
              <div className="vstack gap-0" style={{ textAlign: "left" }}>
                {article.authorName && (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {article.authorName}
                  </span>
                )}
                {publishedDate && (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {publishedDate}
                  </span>
                )}
              </div>
              {section && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.9rem" }}>&middot;</span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.35)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {section.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Featured image ── */}
        {article.featuredImage && (
          <div className="container max-w-xl mt-2 mb-4 lg:mb-6" style={{ position: "relative", zIndex: 1 }}>
            <figure
              className="featured-image m-0 overflow-hidden"
              style={{ borderRadius: "14px", aspectRatio: "16/9", maxHeight: 520 }}
            >
              {/* No data-uc-img here — UIKit lazy loading clears src without data-src fallback */}
              <img
                src={article.featuredImage}
                alt={article.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </figure>
          </div>
        )}

        {/* ── Article body ── */}
        <div className="panel mt-2">
          <div className="container max-w-lg">

            {/* Content */}
            <div
              className="post-content panel"
              data-uc-lightbox="animation: scale"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Share bar */}
            <div
              className="panel vstack sm:hstack gap-3 justify-between py-5 mt-5"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <div className="hstack gap-2 items-center">
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                    marginRight: "4px",
                  }}
                >
                  Share
                </span>
                <a
                  className="share-btn"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on LinkedIn"
                >
                  <i className="unicon-logo-linkedin icon-1"></i>
                </a>
                <a
                  className="share-btn"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Share on X"
                >
                  <i className="unicon-logo-x-filled icon-1"></i>
                </a>
                <a
                  className="share-btn"
                  href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(shareUrl)}`}
                  aria-label="Share by Email"
                >
                  <i className="unicon-email icon-1"></i>
                </a>
              </div>
              <div className="hstack gap-2 items-center">
                {section && (
                  <a
                    href={`/section/${section.slug}`}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-primary)",
                      textDecoration: "none",
                    }}
                  >
                    More in {section.name} &rarr;
                  </a>
                )}
              </div>
            </div>

            {/* Author bio */}
            {article.authorName && (
              <div className="author-bio-card mt-2 mb-5">
                <div className="row g-4 items-center">
                  {article.authorImage && (
                    <div className="col-12 sm:col-auto">
                      <figure
                        className="m-0 overflow-hidden"
                        style={{ width: 90, height: 90, borderRadius: "50%", flexShrink: 0 }}
                      >
                        <img
                          src={article.authorImage}
                          alt={article.authorName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          data-uc-img="loading: lazy"
                        />
                      </figure>
                    </div>
                  )}
                  <div className="col">
                    <div className="vstack gap-2">
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--color-muted)",
                            marginBottom: "4px",
                          }}
                        >
                          Written by
                        </div>
                        <h4 className="author-name">{article.authorName}</h4>
                      </div>
                      {article.authorBio && (
                        <p className="author-bio-text">{article.authorBio}</p>
                      )}
                      {article.authorLinkedIn && (
                        <a
                          href={article.authorLinkedIn}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "var(--color-primary)",
                            textDecoration: "none",
                          }}
                        >
                          <i className="icon-2 unicon-logo-linkedin"></i>
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentSection articleId={article.id} />

          </div>
        </div>
      </article>
    </>
  );
}
