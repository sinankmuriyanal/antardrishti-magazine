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

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* UIKit head scripts — loaded synchronously as in original */}
      <Script src="/assets/js/app-head-bs.js" strategy="beforeInteractive" />
      <Script src="/assets/js/uni-core/js/uni-core-bundle.min.js" strategy="beforeInteractive" />

      <div className="uni-body panel bg-white text-gray-900 dark:bg-black dark:text-gray-200 overflow-x-hidden">
        {/* Search modal */}
        <div id="uc-search-modal" className="uc-modal-full uc-modal" data-uc-modal="overlay: true">
          <div className="uc-modal-dialog d-flex justify-center bg-white text-dark dark:bg-gray-900 dark:text-white" data-uc-height-viewport="">
            <button className="uc-modal-close-default p-0 icon-3 btn border-0 dark:text-white dark:text-opacity-50 hover:text-primary hover:rotate-90 duration-150 transition-all" type="button">
              <i className="unicon-close"></i>
            </button>
            <div className="panel w-100 sm:w-500px px-2 py-10">
              <h3 className="h1 text-center">Search</h3>
              <form className="hstack gap-1 mt-4 border-bottom p-narrow dark:border-gray-700" action="/all-articles">
                <span className="d-inline-flex justify-center items-center w-24px sm:w-40 h-24px sm:h-40px opacity-50">
                  <i className="unicon-search icon-3"></i>
                </span>
                <input type="search" name="q" className="form-control-plaintext ms-1 fs-6 sm:fs-5 w-full dark:text-white" placeholder="Type your keyword.." aria-label="Search" autoFocus />
              </form>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div id="uc-menu-panel" data-uc-offcanvas="overlay: true;">
          <div className="uc-offcanvas-bar bg-white text-dark dark:bg-gray-900 dark:text-white">
            <header className="uc-offcanvas-header hstack justify-between items-center pb-4 bg-white dark:bg-gray-900">
              <div className="uc-logo">
                <a href="/" className="h5 text-none text-gray-900 dark:text-white">
                  <img className="w-32px" src="/assets/images/common/White Logo.png" alt="Antardrishti" data-uc-svg style={{ height: 40, width: 90 }} />
                </a>
              </div>
              <button className="uc-offcanvas-close p-0 icon-3 btn border-0 dark:text-white dark:text-opacity-50 hover:text-primary hover:rotate-90 duration-150 transition-all" type="button">
                <i className="unicon-close"></i>
              </button>
            </header>
            <div className="panel">
              <ul className="nav-y gap-narrow fw-bold fs-5" data-uc-nav>
                <li><a href="/">Home</a></li>
                {NAV_LINKS.map((l) => (
                  <li key={l.href}><a href={l.href}>{l.label}</a></li>
                ))}
              </ul>
              <ul className="social-icons nav-x mt-4">
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer"><i className="unicon-logo-instagram icon-2"></i></a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer"><i className="unicon-logo-linkedin icon-2"></i></a>
                  <a href="mailto:antardrishtidse@gmail.com"><i className="unicon-email icon-2"></i></a>
                </li>
              </ul>
              <div className="py-2 hstack gap-2 mt-4 bg-white dark:bg-gray-900" data-uc-sticky="position: bottom">
                <div className="vstack gap-1">
                  <span className="fs-7 opacity-60">Select theme:</span>
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

        {/* Favorites modal */}
        <div id="uc-favorites-modal" data-uc-modal="overlay: true">
          <div className="uc-modal-dialog lg:max-w-500px bg-white text-dark dark:bg-gray-800 dark:text-white rounded">
            <button className="uc-modal-close-default p-0 icon-3 btn border-0 dark:text-white dark:text-opacity-50 hover:text-primary hover:rotate-90 duration-150 transition-all" type="button">
              <i className="unicon-close"></i>
            </button>
            <div className="panel vstack justify-center items-center gap-2 text-center px-3 py-8">
              <i className="icon icon-4 unicon-bookmark mb-2 text-primary dark:text-white"></i>
              <h2 className="h4 md:h3 m-0">Saved articles</h2>
              <p className="fs-5 opacity-60">You have not yet added any article to your bookmarks!</p>
              <a href="/" className="btn btn-sm btn-primary mt-2 uc-modal-close">Browse articles</a>
            </div>
          </div>
        </div>

        {/* Dark mode + back to top */}
        <div className="backtotop-wrap position-fixed bottom-0 end-0 z-99 m-2 vstack">
          <div className="darkmode-trigger cstack w-40px h-40px rounded-circle text-none bg-gray-100 dark:bg-gray-700 dark:text-white" data-darkmode-toggle="">
            <label className="switch">
              <span className="sr-only">Dark mode toggle</span>
              <input type="checkbox" />
              <span className="slider fs-5"></span>
            </label>
          </div>
          <a className="btn btn-sm bg-primary text-white w-40px h-40px rounded-circle" href="to_top" data-uc-backtotop>
            <i className="icon-2 unicon-chevron-up"></i>
          </a>
        </div>

        {/* Header */}
        <header className="uc-header header-three uc-navbar-sticky-wrap z-999 uc-dark"
          data-uc-sticky="sel-target: .uc-navbar-container; cls-active: uc-navbar-sticky; cls-inactive: uc-navbar-transparent; end: !*;">
          <nav className="uc-navbar-container fs-6 z-1">
            {/* Top bar */}
            <div className="uc-top-navbar panel z-3 min-h-32px lg:min-h-48px mx-2 rounded-bottom overflow-hidden bg-gray-800 text-white uc-dark d-none md:d-block"
              data-uc-navbar=" animation: uc-animation-slide-top-small; duration: 150;">
              <div className="position-cover blend-color" data-src="/assets/images/demo-three/topbar-abstract.jpg" data-uc-img></div>
              <div className="container max-w-xl">
                <div className="hstack panel z-1">
                  <div className="uc-navbar-left gap-2 lg:gap-3">
                    <span className="fs-6 fw-bold dark:text-white opacity-75">
                      <i className="icon-1 unicon-fire text-warning me-1"></i>Antardrishti — DSE MBA Business Analytics
                    </span>
                  </div>
                  <div className="uc-navbar-right gap-2 lg:gap-3">
                    <ul className="uc-social-header nav-x gap-1 d-none lg:d-flex dark:text-white">
                      <li>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-32px h-32px cstack border rounded-circle hover:bg-primary transition-colors duration-200">
                          <i className="icon icon-1 unicon-logo-instagram"></i>
                        </a>
                      </li>
                      <li>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-32px h-32px cstack border rounded-circle hover:bg-primary transition-colors duration-200">
                          <i className="icon icon-1 unicon-logo-linkedin"></i>
                        </a>
                      </li>
                      <li>
                        <a href="mailto:antardrishtidse@gmail.com" className="w-32px h-32px cstack border rounded-circle hover:bg-primary transition-colors duration-200">
                          <i className="icon icon-1 fw-medium unicon-email"></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Center navbar */}
            <div className="uc-center-navbar panel z-2">
              <div className="container max-w-xl">
                <div className="uc-navbar min-h-72px lg:min-h-80px text-gray-900 dark:text-white"
                  data-uc-navbar=" animation: uc-animation-slide-top-small; duration: 150;">
                  <div className="uc-navbar-left">
                    <div className="d-block lg:d-none">
                      <a className="uc-menu-trigger" href="#uc-menu-panel" data-uc-toggle></a>
                    </div>
                    <div className="uc-logo d-none md:d-block text-dark dark:text-white">
                      <a href="/">
                        <img className="text-dark dark:text-white" src="/assets/images/common/White Logo.png" alt="Antardrishti" data-uc-svg style={{ height: 50, width: 110 }} />
                      </a>
                    </div>
                    <ul className="uc-navbar-nav gap-3 ft-tertiary fs-5 fw-medium ms-4 d-none lg:d-flex" style={{ "--uc-nav-height": "80px" } as React.CSSProperties}>
                      {NAV_LINKS.map((l) => (
                        <li key={l.href}><a href={l.href}>{l.label}</a></li>
                      ))}
                    </ul>
                  </div>
                  <div className="uc-navbar-center">
                    <div className="uc-logo d-block md:d-none text-dark dark:text-white">
                      <a href="/">
                        <img className="w-32px" src="/assets/images/common/White Logo.png" alt="Antardrishti" data-uc-svg />
                      </a>
                    </div>
                  </div>
                  <div className="uc-navbar-right">
                    <div className="uc-navbar-item">
                      <div className="uc-modes-trigger icon-2 text-dark dark:text-white" data-darkmode-toggle="">
                        <label className="switch">
                          <span className="sr-only">Dark mode toggle</span>
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

        {/* Page content */}
        <div id="wrapper" className="wrap overflow-hidden-x">
          {children}
        </div>

        {/* Footer */}
        <footer id="uc-footer" className="uc-footer panel uc-dark">
          <div className="footer-outer py-4 lg:py-6 xl:py-9 bg-white dark:bg-gray-900 dark:text-white">
            <div className="container max-w-xl">
              <div className="footer-inner vstack gap-4 lg:gap-6 xl:gap-9">
                <div className="uc-footer-top">
                  <div className="row child-cols col-match gx-4 gy-6">
                    <div className="col d-none lg:d-block">
                      <div className="widget links-widget vstack gap-3">
                        <div className="widgt-title">
                          <h4 className="fs-7 fw-medium text-uppercase m-0 text-dark dark:text-white text-opacity-50">Sections</h4>
                        </div>
                        <div className="widgt-content">
                          <ul className="nav-y gap-2 fs-6 fw-medium text-dark dark:text-white">
                            {NAV_LINKS.filter((l) => l.href.startsWith("/section")).map((l) => (
                              <li key={l.href}><a href={l.href}>{l.label}</a></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 md:col">
                      <div className="widget links-widget vstack gap-3">
                        <div className="widgt-title">
                          <h4 className="fs-7 fw-medium text-uppercase m-0 text-dark dark:text-white text-opacity-50">About</h4>
                        </div>
                        <div className="widgt-content">
                          <ul className="nav-y gap-2 fs-6 fw-medium text-dark dark:text-white">
                            <li><a href="/about-us">About us</a></li>
                            <li><a href="/all-articles">All Articles</a></li>
                            <li><a href="#">DSE - MBA BA</a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 md:col-5">
                      <div className="widget newsletter-widget vstack gap-3">
                        <div className="widgt-title">
                          <h4 className="h4 lg:h3 lg:-ls-2 m-0">Keep up to date with the latest updates &amp; news</h4>
                        </div>
                        <div className="widgt-content">
                          <form className="hstack">
                            <input className="form-control form-control-sm fs-6 fw-medium h-40px rounded-end-0 bg-white dark:bg-gray-800 dark:border-white dark:border-opacity-15" type="email" placeholder="Your email" required />
                            <button className="btn btn-sm btn-primary rounded-start-0 min-w-100px" type="submit">Sign up</button>
                          </form>
                          <ul className="footer-social nav-x gap-2 mt-2 lg:mt-4">
                            <li><a className="hover:text-gray-900 dark:hover:text-white duration-150" href="https://instagram.com" target="_blank" rel="noreferrer"><i className="icon icon-2 unicon-logo-instagram"></i></a></li>
                            <li><a className="hover:text-gray-900 dark:hover:text-white duration-150" href="https://linkedin.com" target="_blank" rel="noreferrer"><i className="icon icon-2 unicon-logo-linkedin"></i></a></li>
                            <li><a className="hover:text-gray-900 dark:hover:text-white duration-150" href="mailto:antardrishtidse@gmail.com"><i className="icon icon-2 fw-medium unicon-email"></i></a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="m-0" />
                <div className="uc-footer-bottom panel vstack lg:hstack gap-4 justify-between fs-7 text-center lg:text-start">
                  <div className="vstack lg:hstack gap-2 items-center">
                    <div className="footer-logo text-center">
                      <img className="uc-logo w-100px text-gray-900 dark:text-white" src="/assets/images/common/White Logo.png" alt="Antardrishti" data-uc-svg />
                    </div>
                    <div className="vr mx-2 d-none lg:d-inline-flex"></div>
                    <p className="footer-copyrights">MBA Business Analytics &copy; {new Date().getFullYear()}, All rights reserved.</p>
                  </div>
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
