import { adminDb } from "@/lib/firebase-admin";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet the team behind Antardrishti — the student magazine of MBA Business Analytics, Delhi School of Economics.",
};

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo?: string;
  linkedin?: string;
  batch?: string;
  order?: number;
}

async function fetchTeam(): Promise<TeamMember[]> {
  try {
    const snap = await adminDb.collection("team").orderBy("order", "asc").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
  } catch { return []; }
}

export default async function TeamPage() {
  const team = await fetchTeam();

  return (
    <>
      {/* Hero */}
      <div style={{ background: "var(--color-ink, #0F1923)", paddingTop: "3.5rem", paddingBottom: "3rem" }}>
        <div className="container max-w-xl" style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            marginBottom: "0.75rem",
          }}>
            The People Behind the Magazine
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "0 0 1rem",
          }}>
            Our Team
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 480,
            margin: "0 auto",
          }}>
            Antardrishti is run by MBA Business Analytics students at Delhi School of Economics, University of Delhi.
          </p>
        </div>
      </div>

      {/* Team grid */}
      <div className="section panel py-7 lg:py-9" style={{ background: "var(--color-warm-bg, #FAF9F6)" }}>
        <div className="container max-w-xl">
          {team.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--color-muted)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem" }}>Team information coming soon.</p>
            </div>
          ) : (
            <div className="row child-cols-12 sm:child-cols-6 md:child-cols-4 lg:child-cols-3 g-5">
              {team.map((m) => (
                <div key={m.id}>
                  <div style={{
                    background: "white",
                    borderRadius: 12,
                    padding: "1.75rem 1.25rem",
                    textAlign: "center",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    border: "1px solid var(--color-border, #E2DDD8)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}>
                    {/* Photo */}
                    {m.photo ? (
                      <img
                        src={m.photo}
                        alt={m.name}
                        style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-border)" }}
                      />
                    ) : (
                      <div style={{
                        width: 88, height: 88, borderRadius: "50%",
                        background: "var(--color-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.8rem", fontWeight: 700, color: "white",
                        fontFamily: "var(--font-display)",
                      }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        margin: "0 0 0.25rem",
                        lineHeight: 1.25,
                      }}>
                        {m.name}
                      </h3>
                      <p style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        margin: 0,
                        letterSpacing: "0.02em",
                      }}>
                        {m.role}
                      </p>
                      {m.batch && (
                        <p style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.7rem",
                          color: "var(--color-muted)",
                          margin: "0.25rem 0 0",
                        }}>
                          {m.batch}
                        </p>
                      )}
                    </div>

                    {/* LinkedIn */}
                    {m.linkedin && (
                      <a
                        href={m.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontFamily: "var(--font-body)", fontSize: "0.72rem",
                          fontWeight: 600, color: "var(--color-primary)",
                          textDecoration: "none", marginTop: "auto",
                        }}
                      >
                        <i className="unicon-logo-linkedin icon-1" /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
