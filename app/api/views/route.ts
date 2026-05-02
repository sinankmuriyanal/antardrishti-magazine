import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/** POST /api/views  body: { articleId, displayId }
 *  Increments the article's totalViews counter and records a daily view. */
export async function POST(req: NextRequest) {
  try {
    const { articleId, displayId } = await req.json() as { articleId?: string; displayId?: string };
    const id = articleId || displayId;
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const batch = adminDb.batch();

    // Increment total on article doc
    batch.update(adminDb.collection("articles").doc(id), {
      totalViews: FieldValue.increment(1),
    });

    // Daily view counter in subcollection
    const dailyRef = adminDb
      .collection("articles").doc(id)
      .collection("views").doc(today);
    batch.set(dailyRef, { count: FieldValue.increment(1), date: today }, { merge: true });

    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Don't fail silently — return 200 so the page doesn't error on miss
    console.error("View tracking error:", e);
    return NextResponse.json({ ok: false });
  }
}

/** GET /api/views?days=30  Returns top articles + daily trend. */
export async function GET(req: NextRequest) {
  try {
    const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") ?? "30"), 90);

    // Get all articles sorted by totalViews
    const snap = await adminDb.collection("articles")
      .orderBy("totalViews", "desc")
      .limit(20)
      .get();

    const topArticles = snap.docs.map((d) => ({
      id: d.id,
      title: (d.data().title as string) ?? "",
      displayId: (d.data().displayId as string) ?? d.id,
      totalViews: (d.data().totalViews as number) ?? 0,
      sectionNumber: (d.data().sectionNumber as number) ?? 0,
    }));

    // Build date range for trend
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    // Aggregate daily views across all articles
    const dailyMap: Record<string, number> = {};
    dates.forEach((d) => (dailyMap[d] = 0));

    // Fetch daily view docs for top 10 articles
    await Promise.all(
      topArticles.slice(0, 10).map(async (art) => {
        const viewsSnap = await adminDb
          .collection("articles").doc(art.id)
          .collection("views")
          .where("date", "in", dates.slice(-28)) // Firestore IN limit 30
          .get();
        viewsSnap.forEach((d) => {
          const data = d.data();
          if (data.date && dailyMap[data.date] !== undefined) {
            dailyMap[data.date] += data.count ?? 0;
          }
        });
      })
    );

    const trend = dates.map((date) => ({ date, views: dailyMap[date] ?? 0 }));

    return NextResponse.json({ topArticles, trend });
  } catch (e) {
    console.error("Views GET error:", e);
    return NextResponse.json({ topArticles: [], trend: [] });
  }
}
