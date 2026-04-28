import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function AboutUsPage() {
  return (
    <>
      <div className="breadcrumbs panel py-2 bg-gray-800 text-white">
        <div className="container max-w-xl">
          <ul className="breadcrumb nav-x gap-1 fs-7 m-0">
            <li><a href="/" className="text-white opacity-60">Home</a></li>
            <li><i className="unicon-chevron-right opacity-50"></i></li>
            <li>About Us</li>
          </ul>
        </div>
      </div>

      <div className="section panel py-6 lg:py-9">
        <div className="container max-w-lg">
          <div className="panel vstack gap-4">
            <div className="text-center">
              <img src="/assets/images/common/White Logo.png" alt="Antardrishti" style={{ height: 60 }} />
              <h1 className="h2 mt-4">About Antardrishti</h1>
              <p className="fs-5 opacity-60 mt-2">DSE MBA Business Analytics Magazine</p>
            </div>

            <div className="page-content panel fs-5 vstack gap-3 mt-4">
              <p>
                <strong>Antardrishti</strong> (अन्तर्दृष्टि) — meaning <em>insight</em> — is the student magazine of the
                MBA Business Analytics programme at the Delhi School of Economics (DSE), University of Delhi.
              </p>
              <p>
                In an era of rapid technological advancement and AI-driven disruption, Antardrishti serves as a platform
                where students, faculty, and industry leaders come together to share perspectives on management,
                analytics, social issues, and campus life.
              </p>
              <p>
                From data-driven analytics and business strategy to diversity, sustainability, and campus chronicles,
                the magazine captures the full spectrum of the DSE experience while fostering intellectual discourse
                across disciplines.
              </p>

              <h3 className="h4 mt-4">Our Sections</h3>
              <ul className="vstack gap-2">
                <li><strong>Editorial</strong> — Perspectives from DSE faculty and programme leadership</li>
                <li><strong>Management</strong> — Industry insights, organisational behaviour, and leadership</li>
                <li><strong>Analytics</strong> — Data science, AI, machine learning, and technology</li>
                <li><strong>What&apos;s Buzzing</strong> — Trending topics and current affairs in business</li>
                <li><strong>Social</strong> — Diversity, women in business, sustainability, and society</li>
                <li><strong>Campus Chronicles</strong> — Events, fests, student life, and achievements</li>
              </ul>

              <h3 className="h4 mt-4">Contact</h3>
              <p>
                For submissions, feedback, or collaboration:&nbsp;
                <a href="mailto:antardrishtidse@gmail.com" className="uc-link">antardrishtidse@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
