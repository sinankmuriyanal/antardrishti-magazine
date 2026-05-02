import type { Article, Section } from "@/types";
import { absoluteImgUrl } from "@/lib/utils";

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

/* ── Shared sub-components ─────────────────────────────────────────────── */

function SectionChip({ name, href }: { name: string; href: string }) {
  return (
    <a href={href} className="text-none" style={{ display: "inline-block" }}>
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-primary)",
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

/**
 * Author pill — top-right corner of every overlay card.
 * Contains: avatar circle · author name · reading time.
 * Frosted-glass background so it reads clearly over any image.
 */
function AuthorTopPill({ article, size = "md" }: { article: Article; size?: "sm" | "md" }) {
  const img = absoluteImgUrl(article.authorImage);
  if (!img && !article.authorName) return null;
  const avatarSize = size === "sm" ? 20 : 24;
  const fontSize  = size === "sm" ? "0.6rem" : "0.65rem";
  return (
    <div style={{
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 3,
      display: "flex",
      alignItems: "center",
      gap: 5,
      background: "rgba(10,14,20,0.58)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 100,
      padding: img ? `3px 10px 3px 3px` : "3px 10px",
      maxWidth: "calc(100% - 20px)",
    }}>
      {img && (
        <img
          src={img}
          alt=""
          style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      )}
      {article.authorName && (
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize,
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 120,
        }}>
          {article.authorName}
        </span>
      )}
      {article.readingTime && (
        <>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.55rem" }}>·</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
            {article.readingTime} min
          </span>
        </>
      )}
    </div>
  );
}

/** Small author circle + name + reading time — dark text, for light backgrounds */
function AuthorMetaLight({ article }: { article: Article }) {
  const img = absoluteImgUrl(article.authorImage);
  const date = formatDate(article.publishedAt);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      {img && (
        <img
          src={img}
          alt=""
          style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--color-border)", flexShrink: 0 }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {article.authorName && (
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.78rem", color: "var(--color-text)" }}>
            {article.authorName}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {date && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.67rem", color: "var(--color-muted)" }}>
              {date}
            </span>
          )}
          {article.readingTime && (
            <>
              {date && <span style={{ color: "var(--color-muted)", fontSize: "0.65rem" }}>·</span>}
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.67rem", color: "var(--color-muted)" }}>
                {article.readingTime} min read
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── HeroArticleCard — main large hero ─────────────────────────────────── */
export function HeroArticleCard({ article, section }: { article: Article; section: Section }) {
  const img = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
  return (
    <article
      className="post type-post panel uc-transition-toggle overflow-hidden h-100"
      style={{ minHeight: 500, position: "relative" }}
    >
      <div className="h-100 position-relative overflow-hidden" style={{ minHeight: 500 }}>
        <img
          className="media-cover image uc-transition-scale-up uc-transition-opaque"
          src={img}
          alt={article.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div className="position-cover" style={{
          background: "linear-gradient(to top, rgba(10,14,20,0.96) 0%, rgba(10,14,20,0.6) 40%, rgba(10,14,20,0.1) 80%, transparent 100%)",
        }} />
        <AuthorTopPill article={article} />
        <div className="position-absolute top-0 start-0 z-1" style={{ padding: "1.25rem 1.5rem 0" }}>
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
        </div>
      </div>
      <a href={articleHref(article)} className="position-cover" aria-label={article.title} />
    </article>
  );
}

/* ── OverlayCard — grid card with image + bottom text ───────────────────── */
export function OverlayCard({ article, section, ratio = "ratio-16x9" }: { article: Article; section: Section; ratio?: string }) {
  const img = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
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
        <AuthorTopPill article={article} />
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
        </div>
      </div>
      <a href={articleHref(article)} className="position-cover" aria-label={article.title} />
    </article>
  );
}

/* ── MiniOverlayCard — compact stacked card for hero sidebar ─────────────── */
export function MiniOverlayCard({ article, section }: { article: Article; section: Section }) {
  const img = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
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
        <AuthorTopPill article={article} size="sm" />
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

/* ── ListCard — horizontal thumbnail + text ─────────────────────────────── */
export function ListCard({ article, section, showExcerpt = false }: { article: Article; section: Section; showExcerpt?: boolean }) {
  const img = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
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
            <AuthorMetaLight article={article} />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── SectionFeaturedCard — wide horizontal card for section page hero ────── */
export function SectionFeaturedCard({ article, section }: { article: Article; section: Section }) {
  const img = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
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
          <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
            <AuthorMetaLight article={article} />
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

/* ── HorizontalCard — image left, text right (section grid style) ──────── */
export function HorizontalCard({ article, section }: { article: Article; section: Section }) {
  const img = absoluteImgUrl(article.featuredImage) ?? FALLBACK;
  return (
    <article
      className="post type-post panel uc-transition-toggle h-card"
      style={{
        display: "flex",
        gap: 0,
        background: "white",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid var(--color-border, #E2DDD8)",
        height: "100%",
      }}
    >
      {/* Image — left column. Use padding-bottom trick so height is always defined */}
      <a
        href={articleHref(article)}
        style={{
          flexShrink: 0,
          width: "38%",
          position: "relative",
          overflow: "hidden",
          display: "block",
          /* padding-bottom aspect-ratio gives the container a real height */
          paddingBottom: 0,
          alignSelf: "stretch",
        }}
      >
        <img
          src={img}
          alt={article.title}
          className="uc-transition-scale-up"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Reading time pill */}
        {article.readingTime && (
          <span style={{
            position: "absolute", bottom: 8, left: 8, zIndex: 1,
            fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 700,
            color: "white", background: "rgba(10,14,20,0.6)", backdropFilter: "blur(4px)",
            padding: "2px 7px", borderRadius: 100,
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            {article.readingTime} min
          </span>
        )}
      </a>

      {/* Text — right column */}
      <div style={{
        flex: 1,
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        minWidth: 0,
      }}>
        {/* Section label */}
        <a
          href={sectionHref(section)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.55rem",
            fontWeight: 700,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            textDecoration: "none",
          }}
        >
          {section.name}
        </a>

        {/* Title */}
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.9rem",
          fontWeight: 700,
          lineHeight: 1.32,
          letterSpacing: "-0.01em",
          color: "var(--color-text, #111318)",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          flex: 1,
        }}>
          <a
            href={articleHref(article)}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {article.title}
          </a>
        </h3>

        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: "0.5rem" }}>
          {absoluteImgUrl(article.authorImage) && (
            <img
              src={absoluteImgUrl(article.authorImage)!}
              alt=""
              style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--color-border)", flexShrink: 0 }}
            />
          )}
          {article.authorName && (
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: "var(--color-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {article.authorName}
            </span>
          )}
        </div>
      </div>

      <a href={articleHref(article)} className="position-cover" aria-label={article.title} />
    </article>
  );
}

/* ── Legacy aliases ─────────────────────────────────────────────────────── */
export function HeroArticleCard2({ article, section }: { article: Article; section: Section }) {
  return <HeroArticleCard article={article} section={section} />;
}
export function MediumArticleCard({ article, section }: { article: Article; section: Section }) {
  return <MiniOverlayCard article={article} section={section} />;
}
export function ListArticleCard({ article, section }: { article: Article; section: Section }) {
  return <ListCard article={article} section={section} />;
}
