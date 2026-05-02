import type { MetadataRoute } from "next";
import { fetchArticlesServer } from "@/lib/articles-server";
import { SECTIONS_DATA } from "@/lib/sections";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://antardrishti-magazine.vercel.app";

export const revalidate = 3600;

function ts(t: unknown): Date {
  const s = (t as { _seconds?: number; seconds?: number } | null)?._seconds
    ?? (t as { seconds?: number } | null)?.seconds;
  return s ? new Date(s * 1000) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/about-us`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/all-articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const sectionEntries: MetadataRoute.Sitemap = SECTIONS_DATA.map((s) => ({
    url: `${SITE_URL}/section/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const articles = await fetchArticlesServer({ published: true });
    articleEntries = articles.map((a) => ({
      url: `${SITE_URL}/article/${a.slug || a.displayId}`,
      lastModified: ts(a.updatedAt ?? a.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch { /* DB unavailable at build — skip article entries */ }

  return [...staticEntries, ...sectionEntries, ...articleEntries];
}
