import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionNumber = searchParams.get("section");
    const published = searchParams.get("published");

    let q: FirebaseFirestore.Query = adminDb.collection("articles");
    if (sectionNumber) q = q.where("sectionNumber", "==", parseInt(sectionNumber));
    if (published === "true") q = q.where("isPublished", "==", true);

    const snap = await q.get();
    const articles = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
      .sort((a, b) => {
        const sa = (a.sectionNumber as number) ?? 0;
        const sb = (b.sectionNumber as number) ?? 0;
        if (sa !== sb) return sa - sb;
        return ((a.articleNumber as number) ?? 0) - ((b.articleNumber as number) ?? 0);
      });
    return NextResponse.json(articles);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ref = await adminDb.collection("articles").add({
      ...body,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
