import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  try {
    let q: FirebaseFirestore.Query = adminDb.collection("comments");
    if (articleId) q = q.where("articleId", "==", articleId).where("isApproved", "==", true);
    const snap = await q.get();
    const comments = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
      .sort((a, b) => {
        const aT = (a.createdAt as { _seconds?: number })?._seconds ?? 0;
        const bT = (b.createdAt as { _seconds?: number })?._seconds ?? 0;
        return articleId ? aT - bT : bT - aT;
      });
    return NextResponse.json(comments);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { articleId, authorName, authorEmail, content } = await req.json();
    if (!articleId || !authorName?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const ref = await adminDb.collection("comments").add({
      articleId,
      authorName: authorName.trim(),
      authorEmail: authorEmail?.trim() ?? "",
      content: content.trim(),
      isApproved: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
