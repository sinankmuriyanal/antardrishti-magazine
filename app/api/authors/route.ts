import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { slugify } from "@/lib/utils";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  try {
    const snap = await adminDb.collection("authors").orderBy("name").get();
    const authors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(authors);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const slug = body.slug?.trim() || slugify(body.name);
    if (!slug) return NextResponse.json({ error: "Could not generate slug" }, { status: 400 });

    await adminDb.collection("authors").doc(slug).set({
      name: body.name.trim(),
      bio: body.bio ?? "",
      photo: body.photo ?? "",
      linkedin: body.linkedin ?? "",
      slug,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
