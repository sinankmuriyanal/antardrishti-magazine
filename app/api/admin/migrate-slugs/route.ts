import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { slugify } from "@/lib/utils";

export async function POST() {
  try {
    const snap = await adminDb.collection("articles").get();

    const toUpdate = snap.docs.filter((d) => {
      const data = d.data();
      return !data.slug && data.title;
    });

    if (toUpdate.length === 0) {
      return NextResponse.json({ updated: 0, message: "All articles already have slugs." });
    }

    // Build slug → count map to handle duplicates
    const existing = new Set(
      snap.docs.map((d) => d.data().slug).filter(Boolean) as string[]
    );
    const used = new Set<string>(existing);

    const batch = adminDb.batch();

    let count = 0;
    for (const doc of toUpdate) {
      const { title } = doc.data() as { title: string };
      let base = slugify(title);
      if (!base) continue;

      // Deduplicate: if slug already used, append displayId
      let slug = base;
      if (used.has(slug)) {
        slug = `${base}-${doc.id.replace(".", "-")}`;
      }
      used.add(slug);

      batch.update(doc.ref, { slug, updatedAt: FieldValue.serverTimestamp() });
      count++;
    }

    await batch.commit();

    return NextResponse.json({ updated: count, message: `Generated slugs for ${count} articles.` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
