import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KADAI — Simple online selling for small businesses",
    template: "%s | KADAI",
  },
  description: "Buka kadai online, without the complicated stuff. KADAI by IZIRA helps microbusinesses create a simple storefront, take orders and manage capacity.",
  applicationName: "KADAI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
