import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Antardrishti", template: "%s | Antardrishti" },
  description: "DSE MBA Business Analytics magazine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
