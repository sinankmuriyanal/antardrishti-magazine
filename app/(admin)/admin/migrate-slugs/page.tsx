"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/utils";
import type { Article } from "@/types";

interface Result {
  id: string;
  title: string;
  slug: string;
  status: "ok" | "skipped" | "error";
  note?: string;
}

export default function MigrateSlugsPage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  async function run() {
    setRunning(true);
    setDone(false);
    setResults([]);

    const snap = await getDocs(collection(db, "articles"));
    const articles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));

    const seen = new Set<string>();
    const out: Result[] = [];

    for (const a of articles) {
      if (a.slug) {
        seen.add(a.slug);
        out.push({ id: a.id, title: a.title, slug: a.slug, status: "skipped", note: "already has slug" });
        continue;
      }
      let base = slugify(a.title);
      let candidate = base;
      let n = 2;
      while (seen.has(candidate)) { candidate = `${base}-${n}`; n++; }
      seen.add(candidate);
      try {
        await updateDoc(doc(db, "articles", a.id), { slug: candidate });
        out.push({ id: a.id, title: a.title, slug: candidate, status: "ok" });
      } catch (e) {
        out.push({ id: a.id, title: a.title, slug: candidate, status: "error", note: String(e) });
      }
    }

    setResults(out);
    setRunning(false);
    setDone(true);
  }

  const counts = results.reduce(
    (acc, r) => { acc[r.status]++; return acc; },
    { ok: 0, skipped: 0, error: 0 }
  );

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <div className="mb-6">
          <a href="/admin" className="text-sm text-gray-500 hover:text-gray-900">← Back to dashboard</a>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Migrate article slugs</h1>
          <p className="text-sm text-gray-500 mt-1">
            One-time tool: generates a URL slug from each article title and writes it to Firestore.
            Articles that already have a slug are skipped. Run once, then use <code className="text-xs bg-gray-100 px-1 rounded">/article/[slug]</code> routes.
          </p>
        </div>

        <div
          className="rounded-xl border p-5 mb-6"
          style={{ borderColor: "#fde68a", background: "#fffbeb" }}
        >
          <p className="text-sm font-semibold text-amber-800 mb-1">Before you run</p>
          <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
            <li>This writes to your live Firestore database.</li>
            <li>Articles that already have slugs will not be changed.</li>
            <li>Slugs are generated from titles — review the results below before linking to them publicly.</li>
          </ul>
        </div>

        <button
          onClick={run}
          disabled={running}
          className="text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-opacity disabled:opacity-50 mb-6"
          style={{ background: "#e8521d" }}
        >
          {running ? "Running migration…" : "Run slug migration"}
        </button>

        {done && (
          <div className="mb-4 flex items-center gap-6 text-sm">
            <span className="text-green-700 font-semibold">{counts.ok} updated</span>
            <span className="text-gray-500">{counts.skipped} skipped</span>
            {counts.error > 0 && <span className="text-red-600 font-semibold">{counts.error} errors</span>}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#faf9f6", borderBottom: "1px solid #f0ece8" }}>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid #f5f3f0" : "none" }}>
                    <td className="px-4 py-2.5 text-gray-800 truncate" style={{ maxWidth: 220 }}>{r.title}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.slug}</td>
                    <td className="px-4 py-2.5">
                      {r.status === "ok" && <span className="text-green-600 font-semibold text-xs">Updated</span>}
                      {r.status === "skipped" && <span className="text-gray-400 text-xs">Skipped</span>}
                      {r.status === "error" && <span className="text-red-500 text-xs font-semibold" title={r.note}>Error</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
