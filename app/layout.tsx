import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IZIRA — Simple selling for small businesses",
  description: "Brunei-first ordering and preorder platform for micro and home-based businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
