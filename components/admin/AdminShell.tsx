"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",                 label: "Dashboard",  icon: "⊞" },
  { href: "/admin/articles",        label: "Articles",   icon: "◻" },
  { href: "/admin/authors",         label: "Authors",    icon: "◉" },
  { href: "/admin/sections",        label: "Sections",   icon: "≡" },
  { href: "/admin/comments",        label: "Comments",   icon: "◇" },
  { href: "/admin/import",          label: "Import",     icon: "↑" },
  { href: "/admin/migrate-slugs",   label: "Slugs",      icon: "⟳" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setLoginError("Invalid email or password.");
    } finally {
      setLoginLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0F1923 0%, #1C2940 100%)" }}
      >
        <div className="w-full max-w-sm mx-4">
          {/* Logo / brand */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: "#e8521d" }}
            >
              <span style={{ color: "white", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>A</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Antardrishti Admin</h1>
            <p className="text-sm text-gray-400">Sign in to manage your magazine</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-xs">⚠</span>
                  <p className="text-xs">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: loginLoading ? "#ccc" : "#e8521d" }}
              >
                {loginLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex`}
        style={{ background: "#0F1923", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Sidebar header */}
        <div
          className="h-14 flex items-center px-4 gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "#e8521d" }}
          >
            <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 800 }}>A</span>
          </div>
          <span className="text-white text-sm font-semibold truncate">Antardrishti</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: isActive ? "white" : "rgba(255,255,255,0.5)",
                  background: isActive ? "rgba(232,82,29,0.15)" : "transparent",
                  borderLeft: isActive ? "2px solid #e8521d" : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: "0.9rem", opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div
          className="p-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="px-3 py-2">
            <div className="text-xs text-gray-500 truncate mb-2">{user.email}</div>
            <button
              onClick={() => signOut(auth)}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors w-full text-left"
              style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="h-14 flex items-center px-4 gap-3 lg:px-6"
          style={{ background: "white", borderBottom: "1px solid #f0ece8" }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div
            className="h-5 w-px mx-1 lg:hidden"
            style={{ background: "#e5e5e5" }}
          />
          <span className="text-sm font-medium text-gray-500">
            {NAV.find((n) => n.href === pathname)?.label ?? "Admin"}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
            >
              View site
              <span style={{ fontSize: "0.7rem" }}>↗</span>
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
