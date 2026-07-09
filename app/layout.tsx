import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TribeWatch — Find your match crowd",
  description:
    "Map-first app to find the best places to watch World Cup games with your team’s crowd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-hidden bg-[#0b1510] font-[family-name:var(--font-body)] text-[#e8f5e9]">
        {children}
      </body>
    </html>
  );
}
