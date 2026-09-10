import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IZIRA — Ideas, thoughtfully built.",
    template: "%s | IZIRA",
  },
  description: "IZIRA is an independent digital product company building thoughtful products and platforms.",
  applicationName: "IZIRA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
