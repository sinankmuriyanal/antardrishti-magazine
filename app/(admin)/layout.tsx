import type { Metadata } from "next";
import "../../app/admin.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Antardrishti Admin" } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
