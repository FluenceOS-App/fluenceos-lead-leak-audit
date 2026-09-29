import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GoogleAnalytics from "./GoogleAnalytics";

export const metadata: Metadata = {
  title: "Lead Leak Audit | FluenceOS",
  description: "Find where potential clients may be slipping through the cracks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<GoogleAnalytics /></body>
    </html>
  );
}
