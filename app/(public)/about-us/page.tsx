import type { Metadata } from "next";
import { SECTIONS_DATA } from "@/lib/sections";

export const metadata: Metadata = {
  title: "About Us",
  description: "Antardrishti — the student magazine of the MBA Business Analytics programme at Delhi School of Economics.",
};

export default function AboutUsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <div className="about-hero-section">
        <div className="container max-w-lg" style={{ position: "relative", zIndex: 1 }}>
          <p className="about-magazine-tagline">DSE · MBA Business Analytics · University of Delhi</p>
          <h1 className="about-magazine-name">Antardrishti</h1>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.45)",
              margin: "0 0 0.75rem",
              letterSpacing: "0.01em",
            }}
          >
            अन्तर्दृष्टि &mdash; Insight
          </p>
          <div className="about-divider"></div>
          <p className="about-magazine-desc">
            A platform where students, faculty, and industry leaders share perspectives on management,
            analytics, social issues, and campus life at the Delhi School of Economics.
          </p>
        </div>
      </div>

      {/* ── About content ── */}
      <div className="section panel py-6 lg:py-9" style={{ background: "#fff" }}>
        <div className="container max-w-lg">
          <div className="row g-6 lg:g-9">

            {/* Main text */}
            <div className="col-12 lg:col-7">
              <div className="vstack gap-4">
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      letterSpacing: "-0.025em",
                      color: "var(--color-text)",
                      margin: "0 0 1.25rem",
                    }}
                  >
                    Insight from every angle
                  </h2>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "1.05rem",
                      lineHeight: 1.8,
                      color: "#3a3d44",
                      margin: "0 0 1.2rem",
                    }}
                  >
                    <strong>Antardrishti</strong> (अन्तर्दृष्टि) &mdash; meaning <em>insight</em> &mdash; is the student magazine of the
                    MBA Business Analytics programme at the Delhi School of Economics (DSE), University of Delhi.
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "1.05rem",
                      lineHeight: 1.8,
                      color: "#3a3d44",
                      margin: "0 0 1.2rem",
                    }}
                  >
                    In an era of rapid technological advancement and AI-driven disruption, Antardrishti serves as a platform
                    where students, faculty, and industry leaders come together to share perspectives on management,
                    analytics, social issues, and campus life.
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "1.05rem",
                      lineHeight: 1.8,
                      color: "#3a3d44",
                      margin: 0,
                    }}
                  >
                    From data-driven analytics and business strategy to diversity, sustainability, and campus chronicles,
                    the magazine captures the full spectrum of the DSE experience while fostering intellectual discourse
                    across disciplines.
                  </p>
                </div>

                {/* Divider line */}
                <div style={{ width: "40px", height: "3px", background: "var(--color-primary)", borderRadius: "2px" }} />

                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      margin: "0 0 1rem",
                      color: "var(--color-text)",
                    }}
                  >
                    Contact & Contributions
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      color: "var(--color-muted)",
                      margin: "0 0 1rem",
                    }}
                  >
                    We welcome submissions, collaborations, and feedback from students, faculty, and industry professionals.
                  </p>
                  <a
                    href="mailto:antardrishtidse@gmail.com"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                    }}
                  >
                    <i className="unicon-email icon-2"></i>
                    antardrishtidse@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Side info */}
            <div className="col-12 lg:col-5">
              <div
                style={{
                  background: "var(--color-warm-bg)",
                  borderRadius: "8px",
                  padding: "2rem",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                    margin: "0 0 1.25rem",
                  }}
                >
                  Publication
                </h3>
                <div className="vstack gap-3">
                  {[
                    { label: "Programme", value: "MBA Business Analytics" },
                    { label: "Institution", value: "Delhi School of Economics" },
                    { label: "University", value: "University of Delhi" },
                    { label: "Current Edition", value: "2nd Edition" },
                    { label: "Sections", value: "6 sections" },
                    { label: "Language", value: "English" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--color-border)" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--color-muted)",
                          marginBottom: "2px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.92rem",
                          fontWeight: 500,
                          color: "var(--color-text)",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Sections grid ── */}
      <div className="section panel py-6 lg:py-8" style={{ background: "var(--color-warm-bg)" }}>
        <div className="container max-w-xl">
          <div className="mag-section-header">
            <div className="mag-section-header__left">
              <span className="mag-section-header__rule" />
              <h2 className="mag-section-header__title">Our Sections</h2>
            </div>
          </div>

          <div className="row child-cols-12 md:child-cols-6 lg:child-cols-4 g-4">
            {SECTIONS_DATA.map((section) => (
              <div key={section.id}>
                <a href={`/section/${section.slug}`} className="text-none d-block h-100">
                  <div className="about-section-card h-100">
                    <div className="about-section-card__number">{String(section.number).padStart(2, "0")}</div>
                    <h3 className="about-section-card__name">{section.name}</h3>
                    <p className="about-section-card__desc">{section.description}</p>
                    <div
                      style={{
                        marginTop: "1rem",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-primary)",
                      }}
                    >
                      Browse &rarr;
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contact CTA ── */}
      <div className="cta-banner">
        <div className="container max-w-xl text-center">
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 600,
              color: "white",
              margin: "0 0 0.75rem",
              letterSpacing: "-0.025em",
            }}
          >
            Read the latest insights
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.45)",
              margin: "0 0 2rem",
            }}
          >
            Management &middot; Analytics &middot; Social &middot; Campus Chronicles
          </p>
          <div className="hstack gap-3 justify-center flex-wrap">
            <a
              href="/all-articles"
              className="btn btn-primary"
              style={{ borderRadius: "3px", padding: "11px 26px", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em" }}
            >
              Browse All Articles
            </a>
            <a
              href="/"
              className="btn"
              style={{
                borderRadius: "3px",
                padding: "11px 26px",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
