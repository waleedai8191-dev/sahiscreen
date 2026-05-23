import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SahiScreen — AI CV Screening for Pakistan",
  description:
    "Screen 100 CVs in 5 minutes. AI-powered candidate shortlisting built for Pakistani HR teams.",
  keywords: "CV screening Pakistan, HR software Pakistan, AI recruitment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-[#FAFAFA] antialiased">{children}</body>
    </html>
  );
}
