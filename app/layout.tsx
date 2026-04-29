import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Antardrishti", template: "%s | Antardrishti" },
  description: "DSE MBA Business Analytics magazine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/unicons.min.css" />
        <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/js/uni-core/css/uni-core.min.css" />
        <link rel="stylesheet" href="/assets/css/theme/demo-three.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
