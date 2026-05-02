"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/types";
interface Props { articleId: string }

function formatDate(ts: { seconds: number } | null) {
  if (!ts) return "";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  border: "1.5px solid var(--color-border, #E2DDD8)",
  borderRadius: "4px",
  background: "white",
  color: "var(--color-text, #111318)",
  outline: "none",
  transition: "border-color 0.2s",
};

export function CommentSection({ articleId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((r) => r.json())
      .then((data) => setComments(data as Comment[]))
      .catch(() => {});
  }, [articleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    if (name.length > 80 || content.length > 2000 || email.length > 200) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, authorName: name, authorEmail: email, content, website }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setName(""); setEmail(""); setContent(""); setWebsite("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="post-comments panel mt-6 pt-6"
      style={{ borderTop: "1px solid var(--color-border, #E2DDD8)" }}
    >
      {/* Header */}
      <div className="hstack items-baseline gap-2 mb-5">
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.2rem",
            fontWeight: 600,
            margin: 0,
            color: "var(--color-text)",
          }}
        >
          Discussion
        </h3>
        {comments.length > 0 && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-muted)",
            }}
          >
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="vstack gap-4 mb-7">
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "1.1rem 1.25rem",
                background: "var(--color-warm-bg, #FAF9F6)",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #E2DDD8)",
              }}
            >
              <div className="hstack justify-between items-center mb-2">
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "var(--color-text)",
                  }}
                >
                  {c.authorName}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    color: "var(--color-muted)",
                  }}
                >
                  {formatDate(c.createdAt as unknown as { seconds: number })}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                  color: "#2a2d35",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div>
        <h4
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            margin: "0 0 1.25rem",
          }}
        >
          Leave a comment
        </h4>

        {status === "sent" ? (
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "#f0faf4",
              borderRadius: "6px",
              border: "1px solid #b7e4c7",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                color: "#1e7e34",
                margin: 0,
              }}
            >
              Comment submitted — it will appear after moderation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="vstack gap-3">
            {/* Honeypot — hidden from users, bots fill it and get silently rejected */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
            <div className="row g-3">
              <div className="col-12 md:col-6">
                <label
                  className="comment-form-label"
                  style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: "6px" }}
                >
                  Name <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div className="col-12 md:col-6">
                <label
                  style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: "6px" }}
                >
                  Email <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>(not published)</span>
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label
                style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: "6px" }}
              >
                Comment <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Share your thoughts on this article…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ ...inputStyle, resize: "vertical", minHeight: "110px" }}
                required
              />
            </div>

            {status === "error" && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  color: "#c0392b",
                  margin: 0,
                }}
              >
                Something went wrong. Please try again.
              </p>
            )}

            <div className="hstack gap-3 items-center">
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn btn-primary btn-sm"
                style={{
                  borderRadius: "3px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  fontSize: "0.8rem",
                  padding: "9px 20px",
                  opacity: status === "sending" ? 0.6 : 1,
                }}
              >
                {status === "sending" ? "Posting…" : "Post Comment"}
              </button>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.72rem",
                  color: "var(--color-muted)",
                  margin: 0,
                }}
              >
                Moderated before appearing
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
