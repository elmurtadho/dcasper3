"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  Zap,
  Terminal,
  Cpu,
  ShieldCheck,
  LogOut,
  Layers,
  Activity,
  ChevronRight,
  Coins,
  MessageSquare,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const [scoutedCount, setScoutedCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);

  // Fetch count badges for navigation
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: scouted } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("lifecycle_stage", "scouted");

        const { count: active } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("lifecycle_stage", "active");

        if (scouted !== null) setScoutedCount(scouted);
        if (active !== null) setActiveCount(active);
      } catch (err) {
        // Fallback counters
        setScoutedCount(3);
        setActiveCount(2);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 6000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: "Intel Radar",
      href: "/",
      icon: Radio,
      badge: scoutedCount > 0 ? `${scoutedCount}` : undefined,
      badgeColor: "bg-cyan-950 text-cyan-400 border-cyan-800/80",
      description: "Scout & Filter Alpha",
    },
    {
      name: "Command Center",
      href: "/command",
      icon: Zap,
      badge: activeCount > 0 ? `${activeCount}` : undefined,
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-800/80",
      description: "Bot Farm Execution",
    },
    {
      name: "Koin & Faucets",
      href: "/assets",
      icon: Coins,
      badge: "VAULT",
      badgeColor: "bg-amber-950 text-amber-400 border-amber-800/80",
      description: "Klaim, Faucet & Swaps",
    },
    {
      name: "Intel AI Chat",
      href: "/chat",
      icon: MessageSquare,
      badge: "RESEARCH",
      badgeColor: "bg-purple-950 text-purple-400 border-purple-800/80",
      description: "Q&A Web Researcher",
    },
  ];

  const renderContent = (isMobile: boolean = false) => (
    <div className="flex flex-col justify-between h-full">
      {/* Top Section: Branding & Navigation */}
      <div className="p-5 space-y-6 overflow-y-auto">
        {/* Branding & Mobile Close */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Terminal className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-black font-mono tracking-wider text-white uppercase">
                WEB3 COMMAND
              </h2>
              <p className="text-[10px] font-mono text-cyan-400 tracking-wide">
                AUTO-FARMING ENGINE
              </p>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 font-mono">
          <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">
            Operations Panel
          </p>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isMobile && onClose) onClose();
                }}
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all relative ${
                  isActive
                    ? "bg-slate-900/90 text-white border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r shadow-[0_0_8px_#22d3ee]"></div>
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-cyan-400 animate-pulse"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <div>
                    <span className="block tracking-tight text-[13px]">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: System Telemetry & Operator Session */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#060a14]/60 font-mono shrink-0">
        {/* Node & Dolphin Telemetry */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" />
              Dolphin Profile:
            </span>
            <span className="text-cyan-300 font-semibold">862684906</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[10px]">
            <span>Local Broker:</span>
            <span className="text-emerald-400">127.0.0.1:3001</span>
          </div>
        </div>

        {/* Operator Badge & Logout */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold tracking-wide">OPERATOR</span>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="px-2.5 py-1 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-[11px] flex items-center gap-1 transition-all active:scale-95"
            title="End Session"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sticky Sidebar (Visible on lg: 1024px+) */}
      <aside className="hidden lg:flex w-64 bg-[#080d19] border-r border-slate-800 flex-col justify-between shrink-0 select-none z-30 h-screen sticky top-0">
        {renderContent(false)}
      </aside>

      {/* 2. Mobile / Tablet Slide-over Drawer (Visible on screens < 1024px when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-[#080d19] border-r border-slate-800 h-full z-10 flex flex-col shadow-2xl">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
