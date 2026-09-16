"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { AuthGuard } from "./AuthGuard";
import {
  Menu,
  Terminal,
  Radio,
  Zap,
  Coins,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Route /login does not require Sidebar or AuthGuard wrapper
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const mobileNavTabs = [
    { name: "Radar", href: "/", icon: Radio },
    { name: "Command", href: "/command", icon: Zap },
    { name: "Koin", href: "/assets", icon: Coins },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
  ];

  return (
    <AuthGuard>
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#070b14] text-slate-100">
        {/* Mobile Top Header Bar (Visible only on screens < 1024px) */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#080d19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                <Terminal className="w-4 h-4 fill-current" />
              </div>
              <span className="font-mono font-bold text-xs tracking-wider text-white uppercase">
                WEB3 COMMAND
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold">OPERATOR</span>
          </div>
        </header>

        {/* Sidebar Component: Dual mode (Desktop Sticky + Mobile Drawer) */}
        <Sidebar
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area: Responsive padding with safe bottom space for mobile tab bar */}
        <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-53px)] lg:h-screen overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Visible only on screens < 1024px) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d19]/95 backdrop-blur-md border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          {mobileNavTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  isActive
                    ? "text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                {/* Active glow pip */}
                {isActive && (
                  <span className="absolute -top-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                )}
                <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                <span className="text-[10px] font-mono tracking-tight mt-0.5">
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </AuthGuard>
  );
};

