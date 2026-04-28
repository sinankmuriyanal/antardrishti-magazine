"use client";

import { useState, useEffect } from "react";
import { fetchApprovedComments, submitComment } from "@/lib/comments";
import type { Comment } from "@/types";

interface Props { articleId: string }

export function CommentSection({ articleId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    fetchApprovedComments(articleId)
      .then(setComments)
      .catch(() => {});
  }, [articleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setStatus("sending");
    try {
      await submitComment({ articleId, authorName: name, authorEmail: email, content });
      setStatus("sent");
      setName(""); setEmail(""); setContent("");
    } catch {
      setStatus("error");
    }
  }

  function formatDate(ts: { seconds: number } | null) {
    if (!ts) return "";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="post-comments panel mt-6 pt-6 border-top">
      <h3 className="h5 m-0 mb-4">
        Comments {comments.length > 0 && <span className="opacity-50 fs-6">({comments.length})</span>}
      </h3>

      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="vstack gap-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="panel p-3 bg-gray-25 dark:bg-gray-800 rounded">
              <div className="hstack justify-between mb-2">
                <strong className="fs-6">{c.authorName}</strong>
                <span className="fs-7 opacity-50">{formatDate(c.createdAt as unknown as { seconds: number })}</span>
              </div>
              <p className="fs-6 m-0">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="panel">
        <h4 className="h6 mb-3">Leave a comment</h4>
        {status === "sent" ? (
          <div className="panel p-3 bg-gray-25 dark:bg-gray-800 rounded text-center">
            <p className="fs-6 m-0 text-success">
              <i className="unicon-checkmark-circle me-1"></i>
              Comment submitted! It will appear after moderation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="vstack gap-3">
            <div className="row g-3">
              <div className="col-12 md:col-6">
                <input
                  type="text"
                  className="form-control form-control-sm h-40px fs-6 bg-white dark:bg-gray-800 dark:border-white dark:border-opacity-15"
                  placeholder="Your name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 md:col-6">
                <input
                  type="email"
                  className="form-control form-control-sm h-40px fs-6 bg-white dark:bg-gray-800 dark:border-white dark:border-opacity-15"
                  placeholder="Email (not published)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <textarea
              className="form-control fs-6 bg-white dark:bg-gray-800 dark:border-white dark:border-opacity-15"
              rows={4}
              placeholder="Write your comment *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            {status === "error" && (
              <p className="fs-7 text-danger m-0">Something went wrong. Please try again.</p>
            )}
            <div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Submitting…" : "Post comment"}
              </button>
              <p className="fs-7 opacity-50 mt-2 mb-0">Comments are moderated before appearing.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
