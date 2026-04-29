import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { getSectionByNumber, SECTIONS_DATA } from "@/lib/sections";
import { ListArticleCard } from "@/components/public/ArticleCard";
import type { Metadata } from "next";
import type { Article } from "@/types";

export const metadata: Metadata = { title: "All Articles" };
export const revalidate = 60;

export default async function AllArticlesPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section: sectionFilter } = await searchParams;

  let articles: Article[] = [];
  try {
    const opts = sectionFilter ? { sectionNumber: parseInt(sectionFilter), published: true } : { published: true };
    articles = await fetchArticles(opts);
  } catch { /* DB not configured */ }

  return (
    <>
      <div className="breadcrumbs panel py-2 bg-gray-800 text-white">
        <div className="container max-w-xl">
          <ul className="breadcrumb nav-x gap-1 fs-7 m-0">
            <li><a href="/" className="text-white opacity-60">Home</a></li>
            <li><i className="unicon-chevron-right opacity-50"></i></li>
            <li>All Articles</li>
          </ul>
        </div>
      </div>

      <div className="section panel py-4 lg:py-6">
        <div className="container max-w-xl">
          <div className="panel hstack justify-between items-center mb-4">
            <h1 className="h3 m-0">All Articles</h1>
            <span className="fs-6 opacity-60">{articles.length} articles</span>
          </div>

          {/* Section filter tabs */}
          <div className="panel mb-4 overflow-x-auto">
            <ul className="nav-x gap-2 fs-6 fw-medium flex-nowrap">
              <li>
                <a href="/all-articles" className={`btn btn-sm ${!sectionFilter ? "btn-primary" : "btn-outline-gray-300 dark:btn-outline-gray-700"}`}>
                  All
                </a>
              </li>
              {SECTIONS_DATA.map((s) => (
                <li key={s.id}>
                  <a href={`/all-articles?section=${s.number}`}
                    className={`btn btn-sm ${sectionFilter === String(s.number) ? "btn-primary" : "btn-outline-gray-300 dark:btn-outline-gray-700"}`}>
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {articles.length === 0 ? (
            <div className="panel py-9 text-center">
              <p className="fs-5 opacity-50">No articles found.</p>
            </div>
          ) : (
            <div className="row child-cols-12 md:child-cols-6 lg:child-cols-4 g-4">
              {articles.map((a) => {
                const sec = getSectionByNumber(a.sectionNumber);
                return sec ? (
                  <div key={a.id}>
                    <ListArticleCard article={a} section={sec} />
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
