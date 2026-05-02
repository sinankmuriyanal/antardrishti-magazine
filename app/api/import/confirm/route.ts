import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const { articles } = await req.json();
    if (!Array.isArray(articles)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const log: string[] = [];
    for (const art of articles) {
      await adminDb.collection("articles").doc(art.displayId).set({
        ...art,
        publishedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      log.push(`✓ ${art.displayId}: ${art.title}`);
    }

    return NextResponse.json({ log });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
