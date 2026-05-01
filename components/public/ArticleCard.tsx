import type { Article, Section } from "@/types";

const FALLBACK = "/assets/images/common/img-fallback.png";

function ts(timestamp: unknown): number {
  if (!timestamp) return 0;
  const t = timestamp as { seconds?: number; _seconds?: number };
  return t.seconds ?? t._seconds ?? 0;
}

function formatDate(timestamp: unknown): string {
  const s = ts(timestamp);
  if (!s) return "";
  return new Date(s * 1000).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function sectionHref(s: Section) { return `/section/${s.slug}`; }
function articleHref(a: Article) { return `/article/${a.slug || a.displayId}`; }

/* ─── Section label chip ─── */
function SectionChip({ name, href, dark = true }: { name: string; href: string; dark?: boolean }) {
  return (
    <a href={href} className="text-none" style={{ display: "inline-block" }}>
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: dark ? "var(--color-primary)" : "var(--color-primary)",
        border: "1px solid var(--color-primary)",
        padding: "2px 9px",
        borderRadius: "2px",
        display: "inline-block",
      }}>
        {name}
      </span>
    </a>
  );
}

/* ─── HeroArticleCard — main featured article ─── */
export function HeroArticleCard({ article, section }: { article: Article; section: Section }) {
  const img = article.featuredImage || FALLBACK;
  const date = formatDate(article.publishedAt);
  return (
    <article
      className="post type-post panel uc-transition-toggle overflow-hidden h-100"
      style={{ minHeight: 500, position: "relative" }}
    >
      {/* Background image */}
      <div className="h-100 position-relative overflow-hidden" style={{ minHeight: 500 }}>
        <img
          className="media-cover image uc-transition-scale-up uc-transition-opaque"
          src={img}
          alt={article.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Multi-layer gradient for depth */}
        <div className="position-cover" style={{
          background: "linear-gradient(to top, rgba(10,14,20,0.96) 0%, rgba(10,14,20,0.6) 40%, rgba(10,14,20,0.1) 80%, transparent 100%)",
        }} />
        {/* Top decorative bar */}
        <div className="position-absolute top-0 start-0 end-0 z-1" style={{ padding: "1.25rem 1.5rem 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            padding: "4px 10px",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "2px",
          }}>
            Edition {article.edition}
          </span>
        </div>
        {/* Content overlay */}
        <div className="position-absolute bottom-0 start-0 end-0 p-4 p-lg-5 z-1">
          <div style={{ marginBottom: "0.75rem" }}>
            <SectionChip name={section.name} href={sectionHref(section)} />
          </div>
          <h2
            className="post-title m-0 text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 2.8vw, 2.1rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              maxWidth: 540,
            }}
          >
            <a
              className="text-none text-white"
              href={articleHref(article)}
              style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {article.title}
            </a>
          </h2>
          {article.excerpt && (
            <p
              className="d-none lg:d-block text-white m-0 mt-2"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.65)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxWidth: 500,
              }}
            >
              {article.excerpt}
            </p>
          )}
          <div className="hstack gap-2 mt-3" style={{ alignItems: "center" }}>
            {article.authorImage && (
              <img
                src={article.authorImage}
                alt=""
                style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }}
              />
            )}
            <div className="hstack gap-1" style={{ alignItems: "center" }}>
              {article.authorName && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                  {article.authorName}
                </span>
              )}
              {article.authorName && date && (
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>&nbsp;&middot;&nbsp;</span>
              )}
              {date && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                  {date}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <a href={articleHref(article)} className="position-cover" aria-label={article.title} />
    </article>
  );
}

/* ─── OverlayCard — grid card with image + bottom text ─── */
export function OverlayCard({ article, section, ratio = "ratio-16x9" }: { article: Article; section: Section; ratio?: string }) {
  const img = article.featuredImage || FALLBACK;
  return (
    <article
      className="post type-post panel uc-transition-toggle overflow-hidden h-100"
      style={{ borderRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
    >
      <div className={`featured-image ${ratio} position-relative overflow-hidden`} style={{ minHeight: 200 }}>
        <img
          className="media-cover image uc-transition-scale-up uc-transition-opaque"
          src={img}
          alt={article.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div className="position-cover" style={{
          background: "linear-gradient(to top, rgba(10,14,20,0.94) 0%, rgba(10,14,20,0.3) 55%, transparent 100%)",
        }} />
        <div className="position-absolute bottom-0 start-0 end-0 p-3 z-1">
          <div style={{ marginBottom: "0.4rem" }}>
            <a href={sectionHref(section)} className="text-none">
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.56rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}>
                {section.name}
              </span>
            </a>
          </div>
          <h3
            className="post-title m-0 text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.95rem",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <a className="text-none text-white" href={articleHref(article)}>{article.title}</a>
          </h3>
          {article.authorName && (
            <div className="mt-2" style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
              {article.authorName}
            </div>
          )}
        </div>
      </div>
      <a href={articleHref(article)} className="position-cover" aria-label={article.title} />
    </article>
  );
}

/* ─── MiniOverlayCard — compact stacked card for hero sidebar ─── */
export function MiniOverlayCard({ article, section }: { article: Article; section: Section }) {
  const img = article.featuredImage || FALLBACK;
  return (
    <article
      className="post type-post panel uc-transition-toggle overflow-hidden h-100"
      style={{ minHeight: 168 }}
    >
      <div className="position-relative overflow-hidden h-100" style={{ minHeight: 168 }}>
        <img
          className="media-cover image uc-transition-scale-up uc-transition-opaque"
          src={img}
          alt={article.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div className="position-cover" style={{
          background: "linear-gradient(to top, rgba(10,14,20,0.95) 0%, rgba(10,14,20,0.3) 55%, transparent 100%)",
        }} />
        <div className="position-absolute bottom-0 start-0 end-0 p-3 z-1">
          <a href={sectionHref(section)} className="text-none" style={{ display: "inline-block", marginBottom: "4px" }}>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-primary)",
            }}>
              {section.name}
            </span>
          </a>
          <h4
            className="post-title m-0 text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.85rem",
              fontWeight: 700,
              lineHeight: 1.28,
              letterSpacing: "-0.01em",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <a className="text-none text-white" href={articleHref(article)}>{article.title}</a>
          </h4>
        </div>
      </div>
      <a href={articleHref(article)} className="position-cover" aria-label={article.title} />
    </article>
  );
}

/* ─── ListCard — horizontal thumbnail + text ─── */
export function ListCard({ article, section, showExcerpt = false }: { article: Article; section: Section; showExcerpt?: boolean }) {
  const img = article.featuredImage || FALLBACK;
  const date = formatDate(article.publishedAt);
  return (
    <article className="post type-post panel uc-transition-toggle">
      <div className="row g-3 items-start">
        <div className="col-4">
          <a
            href={articleHref(article)}
            className="d-block overflow-hidden"
            style={{ aspectRatio: "4/3", borderRadius: "4px" }}
          >
            <img
              className="w-100 h-100 uc-transition-scale-up"
              src={img}
              alt={article.title}
              style={{ objectFit: "cover", display: "block", aspectRatio: "4/3", transition: "transform 0.4s ease" }}
            />
          </a>
        </div>
        <div className="col">
          <div className="vstack gap-1">
            <a
              href={sectionHref(section)}
              className="text-none"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              {section.name}
            </a>
            <h4
              className="post-title m-0"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.9rem",
                fontWeight: 600,
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
              }}
            >
              <a
                className="text-none text-dark dark:text-white"
                href={articleHref(article)}
                style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {article.title}
              </a>
            </h4>
            {showExcerpt && article.excerpt && (
              <p
                className="m-0 d-none md:d-block"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  lineHeight: 1.55,
                  color: "var(--color-muted)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {article.excerpt}
              </p>
            )}
            <div
              className="hstack gap-1 mt-1"
              style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "var(--color-muted)" }}
            >
              {article.authorName && <span className="fw-medium text-dark dark:text-white">{article.authorName}</span>}
              {article.authorName && date && <span>&middot;</span>}
              {date && <span>{date}</span>}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── SectionFeaturedCard — wide horizontal card for section page hero ─── */
export function SectionFeaturedCard({ article, section }: { article: Article; section: Section }) {
  const img = article.featuredImage || FALLBACK;
  const date = formatDate(article.publishedAt);
  return (
    <article className="post type-post panel uc-transition-toggle overflow-hidden" style={{ borderRadius: "6px" }}>
      <div className="row g-0 col-match">
        {/* Image */}
        <div className="col-12 md:col-7 lg:col-8">
          <div className="post-media overflow-hidden h-100" style={{ minHeight: 300 }}>
            <img
              className="media-cover image uc-transition-scale-up uc-transition-opaque"
              src={img}
              alt={article.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 300, transition: "transform 0.5s ease" }}
            />
          </div>
        </div>
        {/* Content */}
        <div className="col-12 md:col-5 lg:col-4 bg-white dark:bg-gray-900 p-4 p-lg-5 vstack justify-center gap-3">
          <div>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-primary)",
            }}>
              {section.name}
            </span>
          </div>
          <h2
            className="m-0 text-dark dark:text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.15rem, 2vw, 1.6rem)",
              fontWeight: 700,
              lineHeight: 1.22,
              letterSpacing: "-0.025em",
            }}
          >
            <a className="text-none text-dark dark:text-white" href={articleHref(article)}>{article.title}</a>
          </h2>
          {article.excerpt && (
            <p
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                lineHeight: 1.7,
                color: "var(--color-muted)",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.excerpt}
            </p>
          )}
          <div className="hstack gap-2 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            {article.authorImage && (
              <img
                src={article.authorImage}
                alt=""
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            )}
            <div className="vstack gap-0">
              {article.authorName && (
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.82rem", color: "var(--color-text)" }}>
                  {article.authorName}
                </span>
              )}
              {date && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-muted)" }}>
                  {date}
                </span>
              )}
            </div>
          </div>
          <a
            href={articleHref(article)}
            className="btn btn-primary btn-sm align-self-start"
            style={{ borderRadius: "3px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", padding: "8px 18px" }}
          >
            Read Article &rarr;
          </a>
        </div>
      </div>
    </article>
  );
}

/* ─── Legacy aliases ─── */
export function HeroArticleCard2({ article, section }: { article: Article; section: Section }) {
  return <HeroArticleCard article={article} section={section} />;
}
export function MediumArticleCard({ article, section }: { article: Article; section: Section }) {
  return <MiniOverlayCard article={article} section={section} />;
}
export function ListArticleCard({ article, section }: { article: Article; section: Section }) {
  return <ListCard article={article} section={section} />;
}
