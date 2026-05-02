import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB hard cap
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

/** Path safety: only allow letters, digits, dot, dash, underscore, slash */
function isSafePath(p: string): boolean {
  if (!p || p.length > 256) return false;
  if (p.startsWith("/") || p.includes("..") || p.includes("\\")) return false;
  return /^[A-Za-z0-9._\-/]+$/.test(p);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const path = form.get("path") as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: "file and path are required" }, { status: 400 });
    }
    if (!isSafePath(path)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type, cacheControl: "public, max-age=31536000" },
    });
    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${path}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
