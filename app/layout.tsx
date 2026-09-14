import type { Metadata } from "next";
import "./globals.css";
import { DashboardShell } from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "Web3 Intelligence & Auto-Farming Command Center",
  description: "Advanced Web3 Airdrop, Mining & Autonomous Browser Farming Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#070b14] text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-black overflow-x-hidden">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
