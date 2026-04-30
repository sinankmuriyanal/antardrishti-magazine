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
  slug: string; // e.g. "the-future-of-analytics"
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string; // HTML
  featuredImage: string;
  authorName: string;
  authorImage: string;
  authorLinkedIn: string;
  authorBio: string;
  authorId?: string; // ref to authors/{id} once authors collection is set up
  tags: string[];
  edition: 1 | 2;
  readingTime?: number; // minutes
  isEditorsPick?: boolean;
  publishedAt: Timestamp | null;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  photo: string;
  linkedin: string;
  slug: string;
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
