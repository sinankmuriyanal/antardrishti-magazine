import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: { default: "Antardrishti", template: "%s | Antardrishti" },
  description: "DSE MBA Business Analytics magazine — Management, Analytics, Social, Campus and more.",
};

const NAV_LINKS = [
  { href: "/section/editorial", label: "Editorial" },
  { href: "/section/management", label: "Management" },
  { href: "/section/analytics", label: "Analytics" },
  { href: "/section/whats-buzzing", label: "What's Buzzing" },
  { href: "/section/social", label: "Social" },
  { href: "/section/campus-chronicles", label: "Campus Chronicles" },
  { href: "/about-us", label: "About Us" },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", icon: "unicon-logo-instagram", label: "Instagram" },
  { href: "https://linkedin.com", icon: "unicon-logo-linkedin", label: "LinkedIn" },
  { href: "mailto:antardrishtidse@gmail.com", icon: "unicon-email", label: "Email" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* UIKit CSS — public pages only, intentionally NOT in root layout so admin is unaffected */}
      <link rel="stylesheet" href="/assets/css/unicons.min.css" />
      <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
      <link rel="stylesheet" href="/assets/js/uni-core/css/uni-core.min.css" />
      <link rel="stylesheet" href="/assets/css/theme/demo-three.min.css" />
      <Script src="/assets/js/app-head-bs.js" strategy="beforeInteractive" />
      <Script src="/assets/js/uni-core/js/uni-core-bundle.min.js" strategy="beforeInteractive" />

      <div className="uni-body panel bg-white text-gray-900 dark:bg-black dark:text-gray-200 overflow-x-hidden">

        {/* ── Search Modal ── */}
        <div id="uc-search-modal" className="uc-modal-full uc-modal" data-uc-modal="overlay: true">
          <div className="uc-modal-dialog d-flex justify-center bg-white text-dark dark:bg-gray-900 dark:text-white" data-uc-height-viewport="">
            <button
              className="uc-modal-close-default p-0 icon-3 btn border-0 dark:text-white dark:text-opacity-50 hover:text-primary hover:rotate-90 duration-150 transition-all"
              type="button"
            >
              <i className="unicon-close"></i>
            </button>
            <div className="panel w-100 sm:w-500px px-2 py-10">
              <h3 className="h2 text-center" style={{ fontFamily: "var(--font-display)" }}>Search Articles</h3>
              <p className="text-center opacity-50 fs-6 mt-1 mb-5" style={{ fontFamily: "var(--font-body)" }}>
                Find articles across all sections
              </p>
              <form className="hstack gap-1 border-bottom p-narrow dark:border-gray-700" action="/all-articles">
                <span className="d-inline-flex justify-center items-center w-40px h-40px opacity-40">
                  <i className="unicon-search icon-3"></i>
                </span>
                <input
                  type="search"
                  name="q"
                  className="form-control-plaintext ms-1 fs-5 w-full dark:text-white"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
                  placeholder="Search by keyword…"
                  aria-label="Search"
                  autoFocus
                />
              </form>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div id="uc-menu-panel" data-uc-offcanvas="overlay: true;">
          <div className="uc-offcanvas-bar bg-white text-dark dark:bg-gray-900 dark:text-white">
            <header className="uc-offcanvas-header hstack justify-between items-center pb-4 bg-white dark:bg-gray-900">
              <div className="uc-logo">
                <a href="/" className="text-none text-gray-900 dark:text-white">
                  <img
                    className="w-32px"
                    src="/assets/images/common/White Logo.png"
                    alt="Antardrishti"
                    data-uc-svg
                    style={{ height: 38, width: "auto" }}
                  />
                </a>
              </div>
              <button
                className="uc-offcanvas-close p-0 icon-3 btn border-0 dark:text-white dark:text-opacity-50 hover:text-primary hover:rotate-90 duration-150 transition-all"
                type="button"
              >
                <i className="unicon-close"></i>
              </button>
            </header>
            <div className="panel">
              <ul className="nav-y gap-2 fw-medium fs-5" data-uc-nav>
                <li><a href="/" style={{ fontFamily: "var(--font-body)" }}>Home</a></li>
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} style={{ fontFamily: "var(--font-body)" }}>{l.label}</a>
                  </li>
                ))}
              </ul>
              <div style={{ height: 1, background: "var(--color-border, #E2DDD8)", margin: "1.25rem 0" }} />
              <ul className="nav-x gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={s.href.startsWith("http") ? "noreferrer" : undefined}
                      className="w-36px h-36px cstack border rounded-circle hover:bg-primary hover:border-primary hover:text-white transition-all duration-200"
                      aria-label={s.label}
                    >
                      <i className={`${s.icon} icon-2`}></i>
                    </a>
                  </li>
                ))}
              </ul>
              <div
                className="py-2 hstack gap-2 mt-4"
                data-uc-sticky="position: bottom"
                style={{ background: "inherit" }}
              >
                <div className="vstack gap-1">
                  <span
                    className="opacity-50"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-body)", fontWeight: 600 }}
                  >
                    Theme
                  </span>
                  <div className="darkmode-trigger" data-darkmode-switch="">
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider fs-5"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Favourites Modal ── */}
        <div id="uc-favorites-modal" data-uc-modal="overlay: true">
          <div className="uc-modal-dialog lg:max-w-500px bg-white text-dark dark:bg-gray-800 dark:text-white rounded">
            <button
              className="uc-modal-close-default p-0 icon-3 btn border-0 dark:text-white dark:text-opacity-50 hover:text-primary hover:rotate-90 duration-150 transition-all"
              type="button"
            >
              <i className="unicon-close"></i>
            </button>
            <div className="panel vstack justify-center items-center gap-2 text-center px-3 py-8">
              <i className="icon icon-4 unicon-bookmark mb-2 text-primary dark:text-white"></i>
              <h2 className="h4 m-0" style={{ fontFamily: "var(--font-display)" }}>Saved Articles</h2>
              <p className="fs-6 opacity-60" style={{ fontFamily: "var(--font-body)" }}>
                You haven&apos;t saved any articles yet.
              </p>
              <a href="/" className="btn btn-sm btn-primary mt-2 uc-modal-close" style={{ borderRadius: "var(--radius-sm)" }}>
                Browse Articles
              </a>
            </div>
          </div>
        </div>

        {/* ── Back to top + dark mode toggle ── */}
        <div className="backtotop-wrap position-fixed bottom-0 end-0 z-99 m-2 vstack gap-1">
          <div
            className="darkmode-trigger cstack w-40px h-40px rounded-circle text-none bg-gray-100 dark:bg-gray-700 dark:text-white"
            data-darkmode-toggle=""
          >
            <label className="switch">
              <span className="sr-only">Toggle dark mode</span>
              <input type="checkbox" />
              <span className="slider fs-5"></span>
            </label>
          </div>
          <a
            className="btn btn-sm bg-primary text-white w-40px h-40px rounded-circle"
            href="to_top"
            data-uc-backtotop
          >
            <i className="icon-2 unicon-chevron-up"></i>
          </a>
        </div>

        {/* ── Header ── */}
        <header
          className="uc-header header-three uc-navbar-sticky-wrap z-999 uc-dark"
          data-uc-sticky="sel-target: .uc-navbar-container; cls-active: uc-navbar-sticky; cls-inactive: uc-navbar-transparent; end: !*;"
        >
          <nav className="uc-navbar-container fs-6 z-1">

            {/* Top bar — DSE banner */}
            <div
              className="uc-top-navbar panel z-3 min-h-40px mx-2 rounded-bottom overflow-hidden uc-dark d-none md:d-block"
              data-uc-navbar=" animation: uc-animation-slide-top-small; duration: 150;"
            >
              <div
                className="position-cover"
                data-src="/assets/images/demo-three/topbar-abstract.jpg"
                data-uc-img
              ></div>
              <div className="container max-w-xl">
                <div className="hstack panel z-1 min-h-40px">
                  <div className="uc-navbar-left">
                    <span
                      className="opacity-75"
                      style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.06em", color: "rgba(255,255,255,0.8)" }}
                    >
                      <i className="icon-1 unicon-fire text-warning me-1"></i>
                      Antardrishti &mdash; DSE MBA Business Analytics
                    </span>
                  </div>
                  <div className="uc-navbar-right gap-2">
                    <ul className="nav-x gap-1 d-none lg:d-flex">
                      {SOCIAL_LINKS.map((s) => (
                        <li key={s.href}>
                          <a
                            href={s.href}
                            target={s.href.startsWith("http") ? "_blank" : undefined}
                            rel={s.href.startsWith("http") ? "noreferrer" : undefined}
                            className="w-28px h-28px cstack border rounded-circle text-white border-white border-opacity-20 hover:bg-primary hover:border-primary transition-colors duration-200"
                            aria-label={s.label}
                          >
                            <i className={`icon-1 ${s.icon}`}></i>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Center navbar */}
            <div className="uc-center-navbar panel z-2">
              <div className="container max-w-xl">
                <div
                  className="uc-navbar min-h-68px lg:min-h-80px text-gray-900 dark:text-white"
                  data-uc-navbar=" animation: uc-animation-slide-top-small; duration: 150;"
                >
                  <div className="uc-navbar-left gap-4">
                    {/* Hamburger (mobile) */}
                    <div className="d-block lg:d-none">
                      <a className="uc-menu-trigger" href="#uc-menu-panel" data-uc-toggle></a>
                    </div>
                    {/* Logo (desktop) */}
                    <div className="uc-logo d-none md:d-block">
                      <a href="/">
                        <img
                          src="/assets/images/common/White Logo.png"
                          alt="Antardrishti"
                          data-uc-svg
                          style={{ height: 46, width: "auto" }}
                        />
                      </a>
                    </div>
                    {/* Nav links */}
                    <ul
                      className="uc-navbar-nav gap-3 ms-2 d-none lg:d-flex"
                      style={{ "--uc-nav-height": "80px" } as React.CSSProperties}
                    >
                      {NAV_LINKS.map((l) => (
                        <li key={l.href}>
                          <a href={l.href}>{l.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Logo (mobile center) */}
                  <div className="uc-navbar-center">
                    <div className="uc-logo d-block md:d-none">
                      <a href="/">
                        <img
                          src="/assets/images/common/White Logo.png"
                          alt="Antardrishti"
                          data-uc-svg
                          style={{ height: 38, width: "auto" }}
                        />
                      </a>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="uc-navbar-right gap-1">
                    <a
                      href="#uc-search-modal"
                      className="btn border-0 p-0 w-36px h-36px cstack text-dark dark:text-white hover:text-primary transition-colors duration-200"
                      data-uc-toggle
                      aria-label="Search"
                    >
                      <i className="unicon-search icon-2"></i>
                    </a>
                    <div className="uc-navbar-item">
                      <div className="uc-modes-trigger icon-2 text-dark dark:text-white ms-1" data-darkmode-toggle="">
                        <label className="switch">
                          <span className="sr-only">Toggle dark mode</span>
                          <input type="checkbox" />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </nav>
        </header>

        {/* ── Page content ── */}
        <div id="wrapper" className="wrap overflow-hidden-x">
          {children}
        </div>

        {/* ── Footer ── */}
        <footer id="uc-footer" className="uc-footer panel uc-dark">
          <div
            className="footer-outer py-5 lg:py-8"
            style={{ background: "#0F1923", color: "rgba(255,255,255,0.85)" }}
          >
            <div className="container max-w-xl">
              <div className="footer-inner vstack gap-5 lg:gap-7">

                {/* Footer top */}
                <div className="row child-cols col-match gx-5 gy-6">

                  {/* Brand column */}
                  <div className="col-12 lg:col-4">
                    <div className="vstack gap-3">
                      <a href="/">
                        <img
                          src="/assets/images/common/White Logo.png"
                          alt="Antardrishti"
                          data-uc-svg
                          style={{ height: 44, width: "auto", filter: "brightness(1.1)" }}
                        />
                      </a>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.88rem",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.5)",
                          margin: 0,
                          maxWidth: 280,
                        }}
                      >
                        The student magazine of the MBA Business Analytics programme at Delhi School of Economics, University of Delhi.
                      </p>
                      <ul className="nav-x gap-2 mt-1">
                        {SOCIAL_LINKS.map((s) => (
                          <li key={s.href}>
                            <a
                              href={s.href}
                              target={s.href.startsWith("http") ? "_blank" : undefined}
                              rel={s.href.startsWith("http") ? "noreferrer" : undefined}
                              className="w-36px h-36px cstack border rounded-circle"
                              style={{
                                color: "rgba(255,255,255,0.5)",
                                borderColor: "rgba(255,255,255,0.15)",
                                transition: "all 0.2s ease",
                                textDecoration: "none",
                              }}
                              aria-label={s.label}
                            >
                              <i className={`${s.icon} icon-2`}></i>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="col-6 lg:col-2">
                    <div className="vstack gap-3">
                      <h4
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.35)",
                          margin: 0,
                        }}
                      >
                        Sections
                      </h4>
                      <ul className="nav-y gap-2">
                        {NAV_LINKS.filter((l) => l.href.startsWith("/section")).map((l) => (
                          <li key={l.href}>
                            <a
                              href={l.href}
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "0.88rem",
                                color: "rgba(255,255,255,0.6)",
                                textDecoration: "none",
                                transition: "color 0.2s",
                              }}
                            >
                              {l.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* About */}
                  <div className="col-6 lg:col-2">
                    <div className="vstack gap-3">
                      <h4
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.35)",
                          margin: 0,
                        }}
                      >
                        About
                      </h4>
                      <ul className="nav-y gap-2">
                        <li>
                          <a href="/about-us" style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                            About Us
                          </a>
                        </li>
                        <li>
                          <a href="/all-articles" style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                            All Articles
                          </a>
                        </li>
                        <li>
                          <a href="https://dse.du.ac.in" target="_blank" rel="noreferrer" style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                            DSE &mdash; MBA BA
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="col-12 lg:col-4">
                    <div className="vstack gap-3">
                      <h4
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.15rem",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.9)",
                          margin: 0,
                          lineHeight: 1.3,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        Stay updated with the latest insights
                      </h4>
                      <form className="hstack gap-0">
                        <input
                          type="email"
                          placeholder="Your email address"
                          required
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRight: "none",
                            borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
                            color: "white",
                            outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            padding: "10px 18px",
                            fontSize: "0.78rem",
                            fontFamily: "var(--font-body)",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            background: "var(--color-primary)",
                            border: "1px solid var(--color-primary)",
                            borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                            color: "white",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Subscribe
                        </button>
                      </form>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.3)",
                          margin: 0,
                        }}
                      >
                        No spam. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

                {/* Footer bottom */}
                <div className="hstack justify-between items-center flex-wrap gap-3">
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.35)",
                      margin: 0,
                    }}
                  >
                    &copy; {new Date().getFullYear()} Antardrishti &mdash; MBA Business Analytics, Delhi School of Economics. All rights reserved.
                  </p>
                  <a
                    href="/"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.25)",
                      textDecoration: "none",
                      letterSpacing: "0.06em",
                    }}
                  >
                    ANTARDRISHTI
                  </a>
                </div>

              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* UIKit deferred scripts */}
      <Script src="/assets/js/libs/jquery.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/libs/bootstrap.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/libs/anime.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/libs/swiper-bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/libs/scrollmagic.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/helpers/data-attr-helper.js" strategy="afterInteractive" />
      <Script src="/assets/js/helpers/swiper-helper.js" strategy="afterInteractive" />
      <Script src="/assets/js/helpers/anime-helper.js" strategy="afterInteractive" />
      <Script src="/assets/js/helpers/anime-helper-defined-timelines.js" strategy="afterInteractive" />
      <Script src="/assets/js/uikit-components-bs.js" strategy="afterInteractive" />
      <Script src="/assets/js/app.js" strategy="afterInteractive" />
    </>
  );
}
