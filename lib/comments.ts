import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Comment } from "@/types";

export async function fetchApprovedComments(articleId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "comments"),
    where("articleId", "==", articleId),
    where("isApproved", "==", true)
  );
  const snap = await getDocs(q);
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
  return comments.sort((a, b) => {
    const aT = (a.createdAt as unknown as { seconds: number })?.seconds ?? 0;
    const bT = (b.createdAt as unknown as { seconds: number })?.seconds ?? 0;
    return aT - bT;
  });
}

export async function fetchAllComments(): Promise<Comment[]> {
  const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export async function submitComment(data: {
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
}): Promise<void> {
  await addDoc(collection(db, "comments"), {
    ...data,
    isApproved: false,
    createdAt: serverTimestamp(),
  });
}

export async function approveComment(id: string): Promise<void> {
  await updateDoc(doc(db, "comments", id), { isApproved: true });
}

export async function deleteComment(id: string): Promise<void> {
  await deleteDoc(doc(db, "comments", id));
}
