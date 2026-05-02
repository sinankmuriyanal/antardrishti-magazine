import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * Verifies the request comes from a signed-in admin.
 *
 * Allow rules (any one is sufficient):
 *  - Decoded ID token has custom claim `admin: true`
 *  - Decoded ID token email is in ADMIN_EMAILS (comma-separated env var)
 *  - Decoded ID token uid is in ADMIN_UIDS (comma-separated env var)
 *
 * Usage:
 *   const guard = await requireAdmin(req);
 *   if (guard) return guard; // 401/403 already populated
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (decoded.admin === true) return null;

  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const uids = (process.env.ADMIN_UIDS ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (decoded.email && emails.includes(decoded.email.toLowerCase())) return null;
  if (uids.includes(decoded.uid)) return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
