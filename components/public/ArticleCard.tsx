import type { Article, Section } from "@/types";

interface ArticleCardProps {
  article: Article;
  section: Section;
  size?: "hero" | "medium" | "small";
}

function formatDate(timestamp: { seconds: number } | null): string {
  if (!timestamp) return "";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sectionHref(section: Section) {
  return `/section/${section.slug}`;
}

function articleHref(article: Article) {
  return `/article/${article.displayId}`;
}

export function HeroArticleCard({ article, section }: { article: Article; section: Section }) {
  return (
    <article className="post type-post panel uc-transition-toggle vstack gap-2 lg:gap-3 h-100 rounded overflow-hidden">
      <div className="post-media panel overflow-hidden h-100">
        <div className="featured-image bg-gray-25 dark:bg-gray-800 h-100 d-none md:d-block">
          <canvas className="h-100 w-100"></canvas>
          <img
            className="media-cover image uc-transition-scale-up uc-transition-opaque"
            src={article.featuredImage}
            data-src={article.featuredImage}
            alt={article.title}
            data-uc-img="loading: lazy"
          />
        </div>
        <div className="featured-image bg-gray-25 dark:bg-gray-800 ratio ratio-16x9 d-block md:d-none">
          <img
            className="media-cover image uc-transition-scale-up uc-transition-opaque"
            src={article.featuredImage}
            data-src={article.featuredImage}
            alt={article.title}
            data-uc-img="loading: lazy"
          />
        </div>
      </div>
      <div className="position-cover bg-gradient-to-t from-black to-transparent opacity-90"></div>
      <div className="post-header panel vstack justify-end items-start gap-1 sm:gap-2 p-2 sm:p-4 position-cover text-white">
        <div className="post-meta panel hstack justify-start gap-1 fs-7 ft-tertiary fw-medium text-gray-900 dark:text-white text-opacity-60 d-none md:d-flex z-1">
          <div className="post-category hstack gap-narrow fw-semibold">
            <a className="fw-medium text-none text-primary dark:text-primary-400" href={sectionHref(section)}>
              {section.name}
            </a>
          </div>
          {article.publishedAt && (
            <>
              <div className="sep d-none md:d-block">|</div>
              <div className="d-none md:d-block">
                <span>{formatDate(article.publishedAt as unknown as { seconds: number })}</span>
              </div>
            </>
          )}
        </div>
        <h3 className="post-title h5 sm:h4 xl:h3 m-0 max-w-600px text-white text-truncate-2">
          <a className="text-none text-white" href={articleHref(article)}>{article.title}</a>
        </h3>
        {article.authorName && (
          <div className="post-meta panel hstack justify-between fs-7 fw-medium text-white text-opacity-60">
            <div className="post-author hstack gap-1">
              {article.authorImage && (
                <img src={article.authorImage} alt={article.authorName} className="w-24px h-24px rounded-circle" />
              )}
              <span className="text-white fw-bold">{article.authorName}</span>
            </div>
          </div>
        )}
      </div>
      <a href={articleHref(article)} className="position-cover"></a>
    </article>
  );
}

export function MediumArticleCard({ article, section }: { article: Article; section: Section }) {
  return (
    <article className="post type-post panel uc-transition-toggle vstack gap-2 lg:gap-3 rounded overflow-hidden">
      <div className="post-media panel overflow-hidden">
        <div className="featured-image bg-gray-25 dark:bg-gray-800 ratio ratio-1x1 sm:ratio-4x3">
          <img
            className="media-cover image uc-transition-scale-up uc-transition-opaque"
            src={article.featuredImage}
            data-src={article.featuredImage}
            alt={article.title}
            data-uc-img="loading: lazy"
          />
        </div>
      </div>
      <div className="position-cover bg-gradient-to-t from-black to-transparent opacity-90"></div>
      <div className="post-header panel vstack justify-start items-start flex-column-reverse gap-1 p-2 position-cover text-white">
        <h3 className="post-title h6 sm:h5 lg:h6 xl:h5 m-0 max-w-600px text-white text-truncate-2">
          <a className="text-none text-white" href={articleHref(article)}>{article.title}</a>
        </h3>
        <div className="post-meta panel hstack justify-start gap-1 fs-7 ft-tertiary fw-medium text-gray-900 dark:text-white text-opacity-60 d-none md:d-flex z-1">
          <a className="fw-medium text-none text-primary dark:text-primary-400" href={sectionHref(section)}>
            {section.name}
          </a>
        </div>
      </div>
      <a href={articleHref(article)} className="position-cover"></a>
    </article>
  );
}

export function ListArticleCard({ article, section }: { article: Article; section: Section }) {
  return (
    <article className="post type-post panel uc-transition-toggle overflow-hidden rounded">
      <div className="row g-3 items-center">
        <div className="col-4">
          <div className="post-media panel overflow-hidden">
            <div className="featured-image bg-gray-25 dark:bg-gray-800 ratio ratio-1x1 rounded">
              <img
                className="media-cover image uc-transition-scale-up uc-transition-opaque"
                src={article.featuredImage}
                data-src={article.featuredImage}
                alt={article.title}
                data-uc-img="loading: lazy"
              />
            </div>
          </div>
        </div>
        <div className="col">
          <div className="post-header vstack gap-1">
            <div className="post-meta hstack gap-1 fs-7 fw-medium">
              <a className="fw-semibold text-none text-primary" href={sectionHref(section)}>{section.name}</a>
              {article.publishedAt && (
                <>
                  <span className="opacity-50">|</span>
                  <span className="opacity-60">{formatDate(article.publishedAt as unknown as { seconds: number })}</span>
                </>
              )}
            </div>
            <h4 className="post-title h6 m-0 text-truncate-2">
              <a className="text-none text-dark dark:text-white" href={articleHref(article)}>{article.title}</a>
            </h4>
            {article.authorName && (
              <span className="fs-7 opacity-60">{article.authorName}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
