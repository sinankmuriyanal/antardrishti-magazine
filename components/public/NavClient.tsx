"use client";
import { useState, useEffect, useCallback } from "react";

const NAV_LINKS = [
  { href: "/",                         label: "Home" },
  { href: "/section/editorial",        label: "Editorial" },
  { href: "/section/management",       label: "Management" },
  { href: "/section/analytics",        label: "Analytics" },
  { href: "/section/whats-buzzing",    label: "What's Buzzing" },
  { href: "/section/social",           label: "Social" },
  { href: "/section/campus-chronicles",label: "Campus Chronicles" },
  { href: "/about-us",                 label: "About Us" },
  // Team hidden until populated — { href: "/team", label: "Team" },
];

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/dse_mba_ba?igsh=c3Y1YXljYTFkN3Zk", icon: "unicon-logo-instagram", label: "Instagram" },
  { href: "https://www.linkedin.com/company/mbadse/", icon: "unicon-logo-linkedin", label: "LinkedIn" },
  { href: "mailto:antardrishtidse@gmail.com", icon: "unicon-email", label: "Email" },
];

/* ── Dark-mode helpers ───────────────────────────────────────────────────── */
function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* */ }
  window.dispatchEvent(new CustomEvent("themechange", { detail: { dark } }));
}

function readTheme(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch { return false; }
}

/* ── SVG icons — reliable across all contexts, no icon-font dependency ── */
function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/* ── Theme toggle button ────────────────────────────────────────────────── */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(readTheme());
    const handler = (e: Event) =>
      setDark((e as CustomEvent<{ dark: boolean }>).detail.dark);
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className={className}
      aria-label="Toggle dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/* ── Search overlay ─────────────────────────────────────────────────────── */
export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const close = useCallback(() => { setOpen(false); setQ(""); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) { window.location.href = `/all-articles?q=${encodeURIComponent(q.trim())}`; }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="btn border-0 p-0 w-36px h-36px cstack text-dark dark:text-white hover:text-primary transition-colors duration-200"
        aria-label="Search"
        style={{ background: "none" }}
      >
        <i className="unicon-search icon-2" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(10,14,20,0.72)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: "10vh",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div style={{
            background: "var(--color-warm-bg, #FAF9F6)",
            borderRadius: 12,
            width: "min(560px, calc(100vw - 32px))",
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}>
            <form onSubmit={submit} style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
              <i className="unicon-search icon-2" style={{ opacity: 0.35, flexShrink: 0 }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search articles…"
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  padding: "18px 12px",
                  fontSize: "1.05rem",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  color: "var(--color-text, #111318)",
                }}
              />
              <button
                type="button"
                onClick={close}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", opacity: 0.4, fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </form>
            <div style={{ borderTop: "1px solid var(--color-border)", padding: "8px 16px" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "var(--color-muted)" }}>
                Press <kbd style={{ background: "#e5e7eb", borderRadius: 3, padding: "1px 5px", fontFamily: "monospace", fontSize: "0.65rem" }}>Enter</kbd> to search · <kbd style={{ background: "#e5e7eb", borderRadius: 3, padding: "1px 5px", fontFamily: "monospace", fontSize: "0.65rem" }}>Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Mobile nav drawer ──────────────────────────────────────────────────── */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(readTheme());
    const handler = (e: Event) =>
      setDark((e as CustomEvent<{ dark: boolean }>).detail.dark);
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          background: "none", border: "none", cursor: "pointer", padding: "6px",
          display: "flex", flexDirection: "column", gap: "5px", justifyContent: "center",
        }}
      >
        <span style={{ display: "block", width: 22, height: 2, background: "white", borderRadius: 2 }} />
        <span style={{ display: "block", width: 22, height: 2, background: "white", borderRadius: 2 }} />
        <span style={{ display: "block", width: 16, height: 2, background: "white", borderRadius: 2 }} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(3px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 9999,
        width: "min(300px, 85vw)",
        background: "var(--color-ink, #0F1923)",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 20px 24px" }}>
          <a href="/">
            <img src="/assets/images/common/White Logo.png" alt="Antardrishti" style={{ height: 36, width: "auto" }} />
          </a>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "1.3rem", padding: "4px" }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 20px" }} />

        {/* Nav links */}
        <nav style={{ padding: "16px 20px", flex: 1 }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.8)",
                    textDecoration: "none",
                    borderRadius: 6,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer of drawer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Social links */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                aria-label={s.label}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                <i className={`${s.icon} icon-2`} />
              </a>
            ))}
          </div>
          {/* Theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Theme
            </span>
            <button
              onClick={toggleTheme}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 100, padding: "5px 12px",
                cursor: "pointer", color: "rgba(255,255,255,0.7)",
                fontFamily: "var(--font-body)", fontSize: "0.75rem",
              }}
            >
              <i className={`icon-1 ${dark ? "unicon-sun" : "unicon-moon"}`} />
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
