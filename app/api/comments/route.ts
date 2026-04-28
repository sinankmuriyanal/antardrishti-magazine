import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  try {
    let q = adminDb.collection("comments").orderBy("createdAt", "desc") as FirebaseFirestore.Query;
    if (articleId) q = q.where("articleId", "==", articleId).where("isApproved", "==", true);
    const snap = await q.get();
    return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
