import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/require-admin";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const snap = await adminDb.collection("authors").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const { id } = await params;
  try {
    const body = await req.json();
    const { slug: _slug, id: _id, createdAt: _ca, ...fields } = body;
    void _slug; void _id; void _ca;
    await adminDb.collection("authors").doc(id).update({
      ...fields,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const { id } = await params;
  try {
    await adminDb.collection("authors").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
