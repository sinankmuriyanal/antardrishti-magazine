import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where,
} from "firebase/firestore";
import { db } from "./firebase";
import { slugify } from "./utils";
import type { Author } from "@/types";

export async function getAuthors(): Promise<Author[]> {
  const snap = await getDocs(collection(db, "authors"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Author));
}

export async function getAuthorById(id: string): Promise<Author | null> {
  const snap = await getDoc(doc(db, "authors", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Author;
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const snap = await getDocs(query(collection(db, "authors"), where("slug", "==", slug)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Author;
}

export async function createAuthor(data: Omit<Author, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const slug = data.slug || slugify(data.name);
  const docRef = doc(db, "authors", slug);
  await setDoc(docRef, { ...data, slug, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return slug;
}

export async function updateAuthor(id: string, data: Partial<Omit<Author, "id">>): Promise<void> {
  await updateDoc(doc(db, "authors", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAuthor(id: string): Promise<void> {
  await deleteDoc(doc(db, "authors", id));
}
