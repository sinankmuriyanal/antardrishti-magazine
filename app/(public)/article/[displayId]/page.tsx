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

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs panel z-1 py-2 bg-gray-800 text-white">
        <div className="container max-w-xl">
          <ul className="breadcrumb nav-x justify-center gap-1 fs-7 sm:fs-6 m-0">
            <li><a href="/" className="text-white opacity-60">Home</a></li>
            <li><i className="unicon-chevron-right opacity-50"></i></li>
            {section && (
              <>
                <li><a href={`/section/${section.slug}`} className="text-white opacity-60">{section.name}</a></li>
                <li><i className="unicon-chevron-right opacity-50"></i></li>
              </>
            )}
            <li><span className="opacity-50 text-truncate">{article.title}</span></li>
          </ul>
        </div>
      </div>

      <div className="position-absolute top-0 start-0 end-0 min-h-450px lg:min-h-600px bg-gray-900 z-0"></div>

      <article className="post type-post single-post py-4 lg:py-6 xl:py-9">
        <div className="container max-w-xl">
          <div className="post-header uc-dark">
            <div className="panel vstack gap-4 md:gap-6 xl:gap-9 text-center">
              {section && (
                <div className="panel">
                  <a href={`/section/${section.slug}`} className="badge bg-primary text-white fw-semibold fs-7 px-2 py-1 rounded">
                    {section.name}
                  </a>
                </div>
              )}
              <div className="panel vstack items-center max-w-400px sm:max-w-500px xl:max-w-md mx-auto gap-2 md:gap-3">
                <h1 className="h4 sm:h3 xl:h1">{article.title}</h1>
                {publishedDate && <p className="fs-6 opacity-60 m-0">{publishedDate}</p>}
              </div>
              {article.featuredImage && (
                <figure className="featured-image m-0">
                  <figure className="featured-image m-0 ratio ratio-2x1 rounded uc-transition-toggle overflow-hidden bg-gray-25 dark:bg-gray-800">
                    <img
                      className="media-cover image uc-transition-scale-up uc-transition-opaque"
                      src={article.featuredImage}
                      data-src={article.featuredImage}
                      alt={article.title}
                      data-uc-img="loading: lazy"
                    />
                  </figure>
                </figure>
              )}
            </div>
          </div>
        </div>

        <div className="panel mt-4 lg:mt-6 xl:mt-9">
          <div className="container max-w-lg">
            {/* Article body */}
            <div
              className="post-content panel fs-6 md:fs-5"
              data-uc-lightbox="animation: scale"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Share bar */}
            <div className="post-footer panel vstack sm:hstack gap-3 justify-between border-top py-4 mt-4 xl:py-9 xl:mt-9">
              <ul className="post-share-icons nav-x gap-narrow">
                <li className="me-1"><span className="text-black dark:text-white">Share:</span></li>
                <li>
                  <a className="btn btn-md btn-outline-gray-100 p-0 w-32px lg:w-40px h-32px lg:h-40px text-dark dark:text-white dark:border-gray-600 hover:bg-primary hover:border-primary hover:text-white rounded-circle"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`/article/${article.displayId}`)}`}
                    target="_blank" rel="noreferrer">
                    <i className="unicon-logo-linkedin icon-1"></i>
                  </a>
                </li>
                <li>
                  <a className="btn btn-md btn-outline-gray-100 p-0 w-32px lg:w-40px h-32px lg:h-40px text-dark dark:text-white dark:border-gray-600 hover:bg-primary hover:border-primary hover:text-white rounded-circle"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}`}
                    target="_blank" rel="noreferrer">
                    <i className="unicon-logo-x-filled icon-1"></i>
                  </a>
                </li>
                <li>
                  <a className="btn btn-md btn-outline-gray-100 p-0 w-32px lg:w-40px h-32px lg:h-40px text-dark dark:text-white dark:border-gray-600 hover:bg-primary hover:border-primary hover:text-white rounded-circle"
                    href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`/article/${article.displayId}`)}`}>
                    <i className="unicon-email icon-1"></i>
                  </a>
                </li>
              </ul>
            </div>

            {/* Author box */}
            {article.authorName && (
              <div className="post-author panel py-4 px-3 sm:p-3 xl:p-4 bg-gray-25 dark:bg-opacity-10 rounded lg:rounded-2">
                <div className="row g-4 items-center">
                  {article.authorImage && (
                    <div className="col-12 sm:col-5 xl:col-3">
                      <figure className="featured-image m-0 ratio ratio-1x1 rounded uc-transition-toggle overflow-hidden bg-gray-25 dark:bg-gray-800">
                        <img
                          className="media-cover image uc-transition-scale-up uc-transition-opaque"
                          src={article.authorImage}
                          data-src={article.authorImage}
                          alt={article.authorName}
                          data-uc-img="loading: lazy"
                        />
                      </figure>
                    </div>
                  )}
                  <div className="col">
                    <div className="panel vstack items-start gap-2 md:gap-3">
                      <h4 className="h5 lg:h4 m-0">{article.authorName}</h4>
                      {article.authorBio && <p className="fs-6 lg:fs-5">{article.authorBio}</p>}
                      {article.authorLinkedIn && (
                        <ul className="nav-x gap-1 text-gray-400 dark:text-white">
                          <li>
                            <a href={article.authorLinkedIn} target="_blank" rel="noreferrer">
                              <i className="icon-2 unicon-logo-linkedin"></i>
                            </a>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments section */}
            <CommentSection articleId={article.id} />
          </div>
        </div>
      </article>
    </>
  );
}
