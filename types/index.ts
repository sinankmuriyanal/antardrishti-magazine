import { Timestamp } from "firebase/firestore";

export interface Section {
  id: string;
  number: number;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface Article {
  id: string;
  sectionId: string;
  sectionNumber: number;
  articleNumber: number;
  displayId: string; // e.g. "1.2"
  title: string;
  excerpt: string;
  content: string; // HTML
  featuredImage: string;
  authorName: string;
  authorImage: string;
  authorLinkedIn: string;
  authorBio: string;
  tags: string[];
  edition: 1 | 2;
  publishedAt: Timestamp | null;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ArticleWithSection extends Article {
  section: Section;
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: Timestamp;
}

export type SectionSlug =
  | "editorial"
  | "management"
  | "analytics"
  | "whats-buzzing"
  | "social"
  | "campus-chronicles";
