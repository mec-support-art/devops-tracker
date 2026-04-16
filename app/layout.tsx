import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DevOps Task Tracker",
  description: "A visual DevOps task dashboard for project managers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
