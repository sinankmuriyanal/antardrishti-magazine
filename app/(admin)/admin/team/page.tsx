"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState, useRef } from "react";
import { authedFetch } from "@/lib/auth-client";

interface Member {
  id: string; name: string; role: string; photo: string;
  linkedin: string; batch: string; order: number;
}
const EMPTY = { name: "", role: "", photo: "", linkedin: "", batch: "", order: 99 };
const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

export default function TeamAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function setField<K extends keyof typeof EMPTY>(k: K, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("path", `team/uploads/${Date.now()}-${file.name}`);
      const res = await authedFetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      setField("photo", url);
    } catch (err) { setError(String(err)); }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name required"); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        const res = await authedFetch(`/api/team/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        setMembers((prev) => prev.map((m) => m.id === editing.id ? { ...m, ...form } : m));
      } else {
        const res = await authedFetch("/api/team", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        await load();
      }
      setEditing(null); setForm(EMPTY);
    } catch (err) { setError(String(err)); }
    setSaving(false);
  }

  async function handleDelete(m: Member) {
    if (!confirm(`Delete ${m.name}?`)) return;
    await authedFetch(`/api/team/${m.id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
  }

  const isOpen = editing !== null || !!form.name;

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team</h1>
            {!loading && <p className="text-sm text-gray-400 mt-0.5">{members.length} members · <a href="/team" target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">View page ↗</a></p>}
          </div>
          <button
            onClick={() => { setEditing(null); setForm(EMPTY); setError(""); }}
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: "#e8521d" }}
          >
            <span className="text-base">+</span> Add member
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-200">⚠ {error}</div>
        )}

        {/* Form */}
        {isOpen && (
          <div className="bg-white rounded-xl border p-5 mb-6 space-y-4" style={{ borderColor: "#f0ece8" }}>
            <h2 className="text-sm font-semibold text-gray-900 pb-3" style={{ borderBottom: "1px solid #f5f3f0" }}>
              {editing ? `Edit: ${editing.name}` : "Add team member"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder="Full name" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role / Position</label>
                  <input type="text" value={form.role} onChange={(e) => setField("role", e.target.value)} className={inputCls} placeholder="Editor-in-Chief" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Batch / Year</label>
                  <input type="text" value={form.batch} onChange={(e) => setField("batch", e.target.value)} className={inputCls} placeholder="MBA BA '26" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                  <input type="url" value={form.linkedin} onChange={(e) => setField("linkedin", e.target.value)} className={inputCls} placeholder="https://linkedin.com/in/…" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Display order</label>
                  <input type="number" value={form.order} onChange={(e) => setField("order", parseInt(e.target.value))} className={inputCls} min={1} />
                </div>
              </div>
              {/* Photo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Photo</label>
                <input type="text" value={form.photo} onChange={(e) => setField("photo", e.target.value)} className={`${inputCls} mb-2`} placeholder="Paste URL or upload" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: "#e8521d", color: "#e8521d", background: "#fef3f0" }}>
                    {uploading ? "Uploading…" : "Upload photo"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  {form.photo && <img src={form.photo} alt="" className="w-10 h-10 rounded-full object-cover" />}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
                  style={{ background: "#e8521d" }}>
                  {saving ? "Saving…" : editing ? "Update" : "Add member"}
                </button>
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); setError(""); }}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members grid */}
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No team members yet. Add the first one above.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: "#f0ece8" }}>
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: "#e8521d" }}>
                    {m.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{m.name}</div>
                  <div className="text-xs text-orange-600 font-medium truncate">{m.role}</div>
                  {m.batch && <div className="text-xs text-gray-400">{m.batch}</div>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(m); setForm({ name: m.name, role: m.role, photo: m.photo, linkedin: m.linkedin, batch: m.batch, order: m.order }); }}
                    className="text-xs font-semibold" style={{ color: "#e8521d" }}>Edit</button>
                  <button onClick={() => handleDelete(m)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
