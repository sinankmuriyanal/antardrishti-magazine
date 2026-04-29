import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { SECTIONS_DATA, getSectionByNumber } from "@/lib/sections";
import { HeroArticleCard, MediumArticleCard, ListArticleCard } from "@/components/public/ArticleCard";
import type { Article } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  let articles: Article[] = [];
  try {
    articles = await fetchArticles({ published: true });
  } catch {
    // DB not configured yet — show empty state
  }

  const featured = articles[0];
  const heroGrid = articles.slice(1, 4);
  const latest = articles.slice(0, 6);

  const sectionGroups = SECTIONS_DATA.map((sec) => ({
    section: sec,
    articles: articles.filter((a) => a.sectionNumber === sec.number).slice(0, 3),
  })).filter((g) => g.articles.length > 0);

  return (
    <>
      {/* Hero grid */}
      <div className="section panel overflow-hidden py-2 bg-gray-25 dark:bg-gray-900 uc-dark">
        <div className="section-outer panel">
          <div className="container container-expand">
            <div className="section-inner panel vstack gap-4">
              <div className="section-content">
                {articles.length === 0 ? (
                  <div className="panel py-9 text-center">
                    <h2 className="h3 opacity-50">No articles yet</h2>
                    <p className="fs-5 opacity-40 mt-2">Run the import scripts to populate the magazine.</p>
                    <a href="/admin" className="btn btn-primary mt-4">Go to Admin</a>
                  </div>
                ) : (
                  <div className="row child-cols-12 md:child-cols-6 g-1 col-match" style={{ minHeight: 500 }}>
                    {featured && (
                      <div>
                        <HeroArticleCard article={featured} section={getSectionByNumber(featured.sectionNumber)!} />
                      </div>
                    )}
                    {heroGrid.length > 0 && (
                      <div>
                        <div className="panel">
                          <div className="row child-cols-6 g-1">
                            {heroGrid.map((a) => (
                              <div key={a.id}>
                                <MediumArticleCard article={a} section={getSectionByNumber(a.sectionNumber)!} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section rows */}
      {sectionGroups.map(({ section, articles: sArticles }) => (
        <div key={section.id} className="section panel py-4 lg:py-6">
          <div className="container max-w-xl">
            <div className="section-header panel hstack justify-between pb-3 border-bottom mb-4">
              <h2 className="h5 m-0 fw-bold">
                <a href={`/section/${section.slug}`} className="text-none text-dark dark:text-white">{section.name}</a>
              </h2>
              <a href={`/section/${section.slug}`} className="btn btn-sm btn-outline-gray-300 dark:btn-outline-gray-700 fs-7 fw-medium">
                View all <i className="unicon-chevron-right ms-1"></i>
              </a>
            </div>
            <div className="row child-cols-12 md:child-cols-4 g-4">
              {sArticles.map((a) => (
                <div key={a.id}>
                  <ListArticleCard article={a} section={section} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Latest articles grid */}
      {latest.length > 0 && (
        <div className="section panel py-4 lg:py-6 bg-gray-25 dark:bg-gray-900">
          <div className="container max-w-xl">
            <div className="section-header panel hstack justify-between pb-3 border-bottom mb-4">
              <h2 className="h5 m-0 fw-bold">Latest Articles</h2>
              <a href="/all-articles" className="btn btn-sm btn-outline-gray-300 dark:btn-outline-gray-700 fs-7 fw-medium">
                All articles <i className="unicon-chevron-right ms-1"></i>
              </a>
            </div>
            <div className="row child-cols-12 sm:child-cols-6 lg:child-cols-4 g-4">
              {latest.map((a) => {
                const sec = getSectionByNumber(a.sectionNumber);
                return sec ? (
                  <div key={a.id}>
                    <ListArticleCard article={a} section={sec} />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
