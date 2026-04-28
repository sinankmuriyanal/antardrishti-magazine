"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { fetchAllComments, approveComment, deleteComment } from "@/lib/comments";
import type { Comment } from "@/types";

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  async function load() {
    setLoading(true);
    try { setComments(await fetchAllComments()); } catch { setComments([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(c: Comment) {
    await approveComment(c.id);
    setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, isApproved: true } : x));
  }

  async function handleDelete(c: Comment) {
    if (!confirm("Delete this comment?")) return;
    await deleteComment(c.id);
    setComments((prev) => prev.filter((x) => x.id !== c.id));
  }

  function formatDate(ts: { seconds: number } | null) {
    if (!ts) return "";
    return new Date((ts as { seconds: number }).seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  const filtered = comments.filter((c) => {
    if (filter === "pending") return !c.isApproved;
    if (filter === "approved") return c.isApproved;
    return true;
  });

  const pending = comments.filter((c) => !c.isApproved).length;

  return (
    <AdminShell>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Comments
            {pending > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">{pending} pending</span>}
          </h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No comments.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{c.authorName}</span>
                        {c.authorEmail && <span className="text-xs text-gray-400">{c.authorEmail}</span>}
                        <span className="text-xs text-gray-400">{formatDate(c.createdAt as unknown as { seconds: number })}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${c.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {c.isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{c.content}</p>
                      <a href={`/article/${c.articleId}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">
                        Article: {c.articleId}
                      </a>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!c.isApproved && (
                        <button onClick={() => handleApprove(c)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                          Approve
                        </button>
                      )}
                      <button onClick={() => handleDelete(c)} className="text-xs border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
