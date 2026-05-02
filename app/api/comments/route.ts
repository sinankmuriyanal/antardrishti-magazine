import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/require-admin";

const MAX_NAME = 80;
const MAX_EMAIL = 200;
const MAX_CONTENT = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** GET: public when ?articleId=...; admin-only otherwise (full moderation queue). */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    const guard = await requireAdmin(req);
    if (guard) return guard;
  }

  try {
    let q: FirebaseFirestore.Query = adminDb.collection("comments");
    if (articleId) q = q.where("articleId", "==", articleId).where("isApproved", "==", true);
    const snap = await q.get();
    const comments = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
      .map((c) => articleId ? { id: c.id, articleId: c.articleId, authorName: c.authorName, content: c.content, createdAt: c.createdAt } : c)
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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { articleId, authorName, authorEmail, content, website } = body as Record<string, unknown>;

    // Honeypot — bots fill hidden fields, real users don't
    if (typeof website === "string" && website.length > 0) {
      return NextResponse.json({ id: "spam" }, { status: 201 });
    }

    if (typeof articleId !== "string" || !articleId.trim()) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }
    if (typeof authorName !== "string" || !authorName.trim() || authorName.length > MAX_NAME) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (typeof content !== "string" || !content.trim() || content.length > MAX_CONTENT) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    let email = "";
    if (authorEmail !== undefined && authorEmail !== null && authorEmail !== "") {
      if (typeof authorEmail !== "string" || authorEmail.length > MAX_EMAIL || !EMAIL_RE.test(authorEmail)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      email = authorEmail.trim();
    }

    const ref = await adminDb.collection("comments").add({
      articleId: articleId.trim(),
      authorName: authorName.trim(),
      authorEmail: email,
      content: content.trim(),
      isApproved: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
