import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const DOC = "heroConfig";

export async function GET() {
  try {
    const snap = await adminDb.collection("config").doc(DOC).get();
    if (!snap.exists) return NextResponse.json({ featuredId: null, sidebarIds: [] });
    return NextResponse.json(snap.data());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await adminDb.collection("config").doc(DOC).set(
      { ...body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
