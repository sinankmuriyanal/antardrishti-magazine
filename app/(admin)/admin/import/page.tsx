"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useState } from "react";
import { authedFetch } from "@/lib/auth-client";

type Step = "idle" | "uploading" | "preview" | "importing" | "done" | "error";

interface ParsedArticle {
  displayId: string;
  title: string;
  sectionNumber: number;
  authorName: string;
  excerpt: string;
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedArticle[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStep("uploading");
    setError("");
    setLog([]);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await authedFetch("/api/import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setPreview(json.articles ?? []);
      setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("error");
    }
  }

  async function handleConfirmImport() {
    setStep("importing");
    try {
      const res = await authedFetch("/api/import/confirm", { method: "POST", body: JSON.stringify({ articles: preview }), headers: { "Content-Type": "application/json" } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");
      setLog(json.log ?? []);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("error");
    }
  }

  const SECTION_NAMES: Record<number, string> = { 1: "Editorial", 2: "Management", 3: "Analytics", 4: "What's Buzzing", 5: "Social", 6: "Campus Chronicles" };

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Import from .docx</h1>
        <p className="text-sm text-gray-500 mb-6">
          Upload <strong>Antardrishti 2nd Edition.docx</strong>. The server will extract articles, images, and author info,
          then continue numbering from the current maximum in each section.
        </p>

        {/* Manual script instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <p className="font-semibold mb-2">Recommended: run scripts manually (more reliable)</p>
          <ol className="list-decimal list-inside space-y-1 text-xs font-mono">
            <li>pip install python-docx beautifulsoup4 pillow requests</li>
            <li>python scripts/extract_docx.py</li>
            <li>python scripts/migrate_html.py</li>
            <li>node --env-file=.env.local scripts/import_to_firestore.js</li>
          </ol>
          <p className="mt-2 text-xs text-blue-600">Or use the web upload below (requires API route + server to be running).</p>
        </div>

        {/* Upload form */}
        {(step === "idle" || step === "error") && (
          <form onSubmit={handleUpload} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select .docx file</label>
              <input
                type="file"
                accept=".docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={!file}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Upload & parse
            </button>
          </form>
        )}

        {step === "uploading" && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="text-gray-500 text-sm">Uploading and parsing docx… this may take a minute.</div>
          </div>
        )}

        {step === "preview" && preview.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-900">{preview.length} articles found</span>
              <div className="flex gap-2">
                <button onClick={() => setStep("idle")} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleConfirmImport} className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Import all</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Section</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Author</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((a) => (
                  <tr key={a.displayId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{a.displayId}</td>
                    <td className="px-4 py-2 text-gray-900 max-w-xs truncate">{a.title}</td>
                    <td className="px-4 py-2 text-gray-500">{SECTION_NAMES[a.sectionNumber]}</td>
                    <td className="px-4 py-2 text-gray-500">{a.authorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {step === "importing" && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="text-gray-500 text-sm">Importing to Firestore…</div>
          </div>
        )}

        {step === "done" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="font-semibold text-green-800 mb-3">✓ Import complete!</p>
            {log.length > 0 && (
              <pre className="text-xs text-green-700 max-h-64 overflow-auto">{log.join("\n")}</pre>
            )}
            <div className="mt-4 flex gap-3">
              <a href="/admin/articles" className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800">View articles</a>
              <button onClick={() => { setStep("idle"); setFile(null); setLog([]); }} className="text-sm border border-green-400 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100">Import more</button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
