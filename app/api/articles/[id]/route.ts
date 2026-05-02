import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/require-admin";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const snap = await adminDb.collection("articles").doc(id).get();
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
    await adminDb.collection("articles").doc(id).update({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const { id } = await params;
  try {
    const body = await req.json();
    await adminDb.collection("articles").doc(id).set({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
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
    await adminDb.collection("articles").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
