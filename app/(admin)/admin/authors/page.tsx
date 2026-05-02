"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState, useRef } from "react";
import { slugify } from "@/lib/utils";
import { authedFetch } from "@/lib/auth-client";
import type { Author } from "@/types";

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white";

const EMPTY: Omit<Author, "id" | "createdAt" | "updatedAt"> = {
  name: "", bio: "", photo: "", linkedin: "", slug: "",
};

export default function AuthorsAdmin() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Author | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as Author[];
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAuthors(data);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing(null);
    setForm(EMPTY);
    setSlugLocked(false);
    setError("");
  }

  function startEdit(a: Author) {
    setEditing(a);
    setForm({ name: a.name, bio: a.bio, photo: a.photo, linkedin: a.linkedin, slug: a.slug });
    setSlugLocked(true);
    setError("");
  }

  function setField<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "name" && !slugLocked) next.slug = slugify(v);
      return next;
    });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("path", `authors/uploads/${Date.now()}-${file.name}`);
      const res = await authedFetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      setField("photo", url);
    } catch (err) { setError(`Photo upload failed: ${err}`); }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const res = await authedFetch(`/api/authors/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, bio: form.bio, photo: form.photo, linkedin: form.linkedin }),
        });
        if (!res.ok) throw new Error(await res.text());
        setAuthors((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } : a));
      } else {
        const res = await authedFetch("/api/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        await load();
      }
      setEditing(null);
      setForm(EMPTY);
      setSlugLocked(false);
    } catch (e) { setError(String(e)); }
    setSaving(false);
  }

  async function handleDelete(a: Author) {
    if (!confirm(`Delete author "${a.name}"? Articles linked to this author will still show their name.`)) return;
    try {
      const res = await authedFetch(`/api/authors/${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setAuthors((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) { setError(String(e)); }
  }

  const [syncing, setSyncing] = useState(false);

  async function syncFromArticles() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const articles = await res.json() as {
        authorName?: string; authorBio?: string; authorImage?: string; authorLinkedIn?: string;
      }[];

      // Build slug → existing author map
      const existingBySlug = new Map(authors.map((a) => [a.slug, a]));
      // Deduplicate articles by author slug, keeping the one with a photo
      const bySlug = new Map<string, { name: string; bio: string; photo: string; linkedin: string; slug: string }>();
      for (const a of articles) {
        if (!a.authorName?.trim()) continue;
        const slug = slugify(a.authorName.trim());
        if (!slug) continue;
        const existing = bySlug.get(slug);
        if (!existing || (!existing.photo && a.authorImage)) {
          bySlug.set(slug, {
            name: a.authorName.trim(),
            bio: a.authorBio ?? "",
            photo: a.authorImage ?? "",
            linkedin: a.authorLinkedIn ?? "",
            slug,
          });
        }
      }

      const toCreate: typeof bySlug extends Map<string, infer V> ? V[] : never[] = [];
      const toUpdate: { id: string; photo: string }[] = [];

      for (const [slug, data] of bySlug) {
        const existing = existingBySlug.get(slug);
        if (!existing) {
          toCreate.push(data);
        } else if (!existing.photo && data.photo) {
          // Update photo for existing authors who are missing one
          toUpdate.push({ id: existing.id, photo: data.photo });
        }
      }

      if (toCreate.length === 0 && toUpdate.length === 0) {
        setError("All authors are already up to date.");
        setSyncing(false);
        return;
      }

      await Promise.all([
        ...toCreate.map((author) =>
          authedFetch("/api/authors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(author),
          })
        ),
        ...toUpdate.map(({ id, photo }) =>
          authedFetch(`/api/authors/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo }),
          })
        ),
      ]);
      await load();
    } catch (e) { setError(String(e)); }
    setSyncing(false);
  }

  const isFormOpen = editing !== null || !!form.name || !!form.bio;

  return (
    <AdminShell>
      <div className="max-w-5xl">

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Authors</h1>
            {!loading && <p className="text-sm text-gray-400 mt-0.5">{authors.length} authors</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncFromArticles}
              disabled={syncing || loading}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: "#e8521d", color: "#e8521d", background: "#fef3f0" }}
              title="Import author profiles from existing article data"
            >
              {syncing ? "Syncing…" : "↓ Sync from articles"}
            </button>
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: "#e8521d" }}
            >
              <span className="text-base">+</span> New author
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Form panel */}
        {isFormOpen && (
          <div className="bg-white rounded-xl border p-5 mb-6 space-y-4" style={{ borderColor: "#f0ece8" }}>
            <h2 className="text-sm font-semibold text-gray-900 pb-3" style={{ borderBottom: "1px solid #f5f3f0" }}>
              {editing ? `Edit: ${editing.name}` : "New author"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder="Full name" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                  <input type="url" value={form.linkedin} onChange={(e) => setField("linkedin", e.target.value)} className={inputCls} placeholder="https://linkedin.com/in/…" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slug</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={form.slug}
                    onChange={(e) => { setField("slug", e.target.value); setSlugLocked(true); }}
                    className={`${inputCls} font-mono`}
                    placeholder="auto-generated"
                    readOnly={!!editing}
                  />
                  {!editing && (
                    <button type="button" onClick={() => { setSlugLocked(false); setField("name", form.name); }}
                      className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 bg-white flex-shrink-0">
                      ↺ Reset
                    </button>
                  )}
                </div>
                {editing && <p className="text-xs text-gray-400 mt-1">Slug cannot be changed after creation.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio / designation</label>
                <input type="text" value={form.bio} onChange={(e) => setField("bio", e.target.value)} className={inputCls} placeholder="MBA Business Analytics '25, DSE" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Photo</label>
                <input type="text" value={form.photo} onChange={(e) => setField("photo", e.target.value)} className={`${inputCls} mb-2`} placeholder="Paste URL or upload" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors"
                    style={{ borderColor: "#e8521d", color: "#e8521d", background: "#fef3f0" }}>
                    {uploading ? "Uploading…" : "Upload photo"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  {form.photo && (
                    <img src={form.photo} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: "1.5px solid #f0ece8" }} />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
                  style={{ background: "#e8521d" }}>
                  {saving ? "Saving…" : editing ? "Update author" : "Create author"}
                </button>
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); setError(""); }}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Authors list */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f0ece8" }}>
          {loading ? (
            <div className="p-10 text-center">
              <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-400">Loading authors…</p>
            </div>
          ) : authors.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl mb-3" style={{ opacity: 0.12 }}>◉</div>
              <p className="text-sm text-gray-500 font-medium mb-1">No authors yet</p>
              <p className="text-xs text-gray-400">Create your first author using the button above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#faf9f6", borderBottom: "1px solid #f0ece8" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">LinkedIn</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {authors.map((a, i) => (
                  <tr key={a.id} style={{ borderTop: i > 0 ? "1px solid #f5f3f0" : "none" }} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.photo ? (
                          <img src={a.photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: "#e8521d" }}>
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{a.name}</div>
                          {a.bio && <div className="text-xs text-gray-400 truncate" style={{ maxWidth: 200 }}>{a.bio}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-gray-400">{a.slug}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {a.linkedin ? (
                        <a href={a.linkedin} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block" style={{ maxWidth: 180 }}>
                          {a.linkedin.replace("https://linkedin.com/in/", "")}
                        </a>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a href={`/author/${a.slug}`} target="_blank" rel="noreferrer"
                          className="text-xs text-gray-400 hover:text-gray-700">View ↗</a>
                        <button onClick={() => startEdit(a)}
                          className="text-xs font-semibold hover:opacity-80"
                          style={{ color: "#e8521d" }}>Edit</button>
                        <button onClick={() => handleDelete(a)}
                          className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
