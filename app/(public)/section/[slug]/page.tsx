import { notFound } from "next/navigation";
import { fetchArticlesServer as fetchArticles } from "@/lib/articles-server";
import { getSectionBySlug } from "@/lib/sections";
import { ListArticleCard } from "@/components/public/ArticleCard";
import type { Metadata } from "next";
import type { Article } from "@/types";

export const revalidate = 60;

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
    articles = await fetchArticles({ sectionNumber: section.number, published: true });
  } catch { /* DB not configured */ }

  return (
    <>
      {/* Section header */}
      <div className="section-hero panel py-4 lg:py-6 bg-gray-900 uc-dark text-white">
        <div className="container max-w-xl">
          <div className="breadcrumbs mb-3">
            <ul className="breadcrumb nav-x gap-1 fs-7 m-0 opacity-60">
              <li><a href="/" className="text-white">Home</a></li>
              <li><i className="unicon-chevron-right"></i></li>
              <li><span>{section.name}</span></li>
            </ul>
          </div>
          <h1 className="h2 lg:h1 m-0">{section.name}</h1>
          <p className="fs-5 opacity-60 mt-2">{section.description}</p>
        </div>
      </div>

      {/* Articles grid */}
      <div className="section panel py-4 lg:py-6">
        <div className="container max-w-xl">
          {articles.length === 0 ? (
            <div className="panel py-9 text-center">
              <p className="fs-5 opacity-50">No articles in this section yet.</p>
            </div>
          ) : (
            <div className="row child-cols-12 md:child-cols-6 lg:child-cols-4 g-4">
              {articles.map((a) => (
                <div key={a.id}>
                  <ListArticleCard article={a} section={section} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
