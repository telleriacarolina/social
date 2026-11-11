
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Social — All Your Social Worlds. One Place.",
    template: "%s | Social",
  },
  description:
    "A place to share, discover, connect, and build meaningful communities.",
  applicationName: "Social",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
