import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionNumber = searchParams.get("section");
    const published = searchParams.get("published");

    let q = adminDb.collection("articles").orderBy("sectionNumber").orderBy("articleNumber");
    if (sectionNumber) q = q.where("sectionNumber", "==", parseInt(sectionNumber)) as typeof q;
    if (published === "true") q = q.where("isPublished", "==", true) as typeof q;

    const snap = await q.get();
    const articles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
