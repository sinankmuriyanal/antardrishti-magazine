import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Section } from "@/types";

export const SECTIONS_DATA: Section[] = [
  { id: "section-1", number: 1, name: "Editorial", slug: "editorial", description: "Editorial perspectives from DSE faculty and leadership", order: 1 },
  { id: "section-2", number: 2, name: "Management", slug: "management", description: "Management insights and industry perspectives", order: 2 },
  { id: "section-3", number: 3, name: "Analytics", slug: "analytics", description: "Data analytics, AI, and technology deep-dives", order: 3 },
  { id: "section-4", number: 4, name: "What's Buzzing", slug: "whats-buzzing", description: "Trending topics and current affairs in business", order: 4 },
  { id: "section-5", number: 5, name: "Social", slug: "social", description: "Social issues, diversity, and sustainability", order: 5 },
  { id: "section-6", number: 6, name: "Campus Chronicles", slug: "campus-chronicles", description: "DSE campus life, events, and student stories", order: 6 },
];

export function getSectionBySlug(slug: string): Section | undefined {
  return SECTIONS_DATA.find((s) => s.slug === slug);
}

export function getSectionByNumber(number: number): Section | undefined {
  return SECTIONS_DATA.find((s) => s.number === number);
}

export async function fetchSections(): Promise<Section[]> {
  const q = query(collection(db, "sections"), orderBy("order"));
  const snap = await getDocs(q);
  if (snap.empty) return SECTIONS_DATA;
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Section));
}
