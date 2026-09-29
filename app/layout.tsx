import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GoogleAnalytics from "./GoogleAnalytics";

export const metadata: Metadata = {
  title: "Lead Leak Audit | FluenceOS",
  description:
    "Take the free 2-minute Lead Leak Audit to find where potential clients may be slipping through the cracks and what to fix first.",

  alternates: {
    canonical: "https://audit.fluenceos.io/",
  },

  openGraph: {
    title: "Lead Leak Audit | FluenceOS",
    description:
      "Find where potential clients may be slipping through the cracks and what to fix first.",
    url: "https://audit.fluenceos.io/",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Lead Leak Audit | FluenceOS",
    description:
      "Find where potential clients may be slipping through the cracks and what to fix first.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<GoogleAnalytics /></body>
    </html>
  );
}
