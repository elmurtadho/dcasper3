"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, Project } from "@/lib/supabaseClient";
import {
  Coins,
  Droplet,
  ArrowRightLeft,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  Radio,
  Layers,
} from "lucide-react";

interface ParsedAsset {
  id: string;
  projectId: string;
  projectName: string;
  token: string;
  network: string;
  type: string;
  tier: string;
  budget: string;
  estimatedReturn: string;
  portalUrl: string;
  tasks: {
    name: string;
    status: string;
    interval?: string;
    isFaucet: boolean;
    isSwap: boolean;
  }[];
  isReadyForFaucet: boolean;
  isReadyForSwap: boolean;
  isZeroBudget: boolean;
  commandPayload: string;
}

export default function AssetsVaultPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<"all" | "faucet" | "swap" | "free">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSendingUrgent, setIsSendingUrgent] = useState<boolean>(false);
  const [urgentFeedback, setUrgentFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data as Project[]);
      }
    } catch (err) {
      console.error("Failed to load projects for assets vault:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trigger Urgent Alert to Discord
  const handleTriggerUrgentAlert = async () => {
    setIsSendingUrgent(true);
    setUrgentFeedback("🚨 Mengirim alert klaim koin/faucet & swap ke channel Discord...");
    try {
      const res = await fetch("/api/radar/scan?urgent=true", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setUrgentFeedback(
          `✅ Berhasil! ${data.urgentItemsCount} peluang klaim/swap dikirim ke Discord sebagai Urgent Alert.`
        );
      } else {
        setUrgentFeedback("⚠️ Gagal mengirim alert: " + (data.error || "Unknown"));
      }
    } catch (err: any) {
      setUrgentFeedback("⚠️ Error: " + err.message);
    } finally {
      setIsSendingUrgent(false);
      setTimeout(() => setUrgentFeedback(null), 7000);
    }
  };

  // Parse structured assets from projects
  const assets: ParsedAsset[] = projects.map((p) => {
    const intel = p.intel_data || {};
    const rawTasks = intel.tasks || [];
    const budgetStr = String(intel.budget_requirement || intel.capital_cost || "").toLowerCase();
    const isZero = budgetStr.includes("zero") || budgetStr.includes("free") || budgetStr.includes("gas only");

    const parsedTasks = rawTasks.map((t) => {
      const nameLower = String(t.name || "").toLowerCase();
      const typeLower = String(t.type || "").toLowerCase();
      const isFaucet = nameLower.includes("faucet") || nameLower.includes("claim") || nameLower.includes("drip");
      const isSwap = nameLower.includes("swap") || nameLower.includes("trade") || nameLower.includes("bex") || nameLower.includes("withdraw");
      return {
        name: t.name,
        status: t.status || "pending",
        interval: t.interval,
        isFaucet,
        isSwap,
      };
    });

    const isReadyForFaucet = parsedTasks.some((t) => t.isFaucet && (t.status === "ready" || t.status === "operational"));
    const isReadyForSwap = parsedTasks.some((t) => t.isSwap && (t.status === "ready" || t.status === "operational"));

    return {
      id: p.id,
      projectId: p.id,
      projectName: p.name,
      token: intel.reward_token || p.type.split(" ")[0] || "TOKEN",
      network: intel.network || intel.network_type || "Web3 Multi-Chain",
      type: p.type,
      tier: intel.tier || "Alpha Tier",
      budget: intel.budget_requirement || (isZero ? "Zero Budget (Free)" : "Gas Only"),
      estimatedReturn: intel.estimated_return || "$1,000 - $3,500",
      portalUrl: intel.dashboard_url || "https://dcasper3.vercel.app",
      tasks: parsedTasks,
      isReadyForFaucet,
      isReadyForSwap,
      isZeroBudget: isZero,
      commandPayload: p.command_payload || "--task=default",
    };
  });

  // Filtered Assets
  const filteredAssets = assets.filter((item) => {
    const matchesSearch =
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.network.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "faucet") return item.isReadyForFaucet;
    if (filterType === "swap") return item.isReadyForSwap;
    if (filterType === "free") return item.isZeroBudget;
    return true;
  });

  const totalFaucetsReady = assets.filter((a) => a.isReadyForFaucet).length;
  const totalSwapsReady = assets.filter((a) => a.isReadyForSwap).length;
  const totalZeroBudget = assets.filter((a) => a.isZeroBudget).length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Coins className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white uppercase">
                  Vault Koin, Faucet & Swaps
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                  ASSET RADAR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Pantau seluruh koin airdrop, ketersediaan klaim faucet gratis, dan jadwal swap/withdraw aset.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerUrgentAlert}
            disabled={isSendingUrgent}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSendingUrgent ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 fill-current text-white" />
            )}
            <span>{isSendingUrgent ? "Mengirim Alert..." : "🚨 Urgent Alert ke Discord"}</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Urgent Feedback Notification */}
      {urgentFeedback && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/90 text-rose-200 text-xs font-mono flex items-center gap-2.5 animate-fadeIn shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <span>{urgentFeedback}</span>
        </div>
      )}

      {/* HUD Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Koin Terpantau</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black font-mono text-white mt-1.5">{assets.length} Koin</p>
          <span className="text-[11px] font-mono text-slate-500">Multi-Chain Ecosystem</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0f1d] border border-cyan-900/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
            <span>Faucet Siap Klaim</span>
            <Droplet className="w-4 h-4 text-cyan-400 animate-bounce" />
          </div>
          <p className="text-2xl font-black font-mono text-cyan-300 mt-1.5">{totalFaucetsReady} Siap</p>
          <span className="text-[11px] font-mono text-cyan-500/80">Reset Harian / Interval</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0f1d] border border-emerald-900/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>DEX Swap & Withdraw</span>
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-1.5">{totalSwapsReady} Siap</p>
          <span className="text-[11px] font-mono text-emerald-500/80">Tukar ke Token Reward</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0f1d] border border-purple-900/40 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-purple-400">
            <span>Zero Budget (Gratis)</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black font-mono text-purple-300 mt-1.5">{totalZeroBudget} Proyek</p>
          <span className="text-[11px] font-mono text-purple-500/80">Modal 0 USD (Testnet)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-[#0a0f1d] border border-slate-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              filterType === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("faucet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              filterType === "faucet"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                : "text-slate-400 hover:text-cyan-300"
            }`}
          >
            <Droplet className="w-3 h-3 text-cyan-400" />
            Faucet Siap ({totalFaucetsReady})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("swap")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              filterType === "swap"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
            Siap Swap ({totalSwapsReady})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("free")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              filterType === "free"
                ? "bg-purple-950 text-purple-300 border border-purple-800"
                : "text-slate-400 hover:text-purple-300"
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            Zero Budget ({totalZeroBudget})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama koin, faucet, atau jaringan..."
          className="w-full sm:w-64 px-3 py-1.5 bg-[#050811] border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
        />
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-mono text-sm bg-[#0a0f1d] border border-slate-800 rounded-2xl">
            Tidak ada koin atau faucet yang sesuai dengan filter pencarian ini.
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="p-5 rounded-2xl bg-[#090e1c] border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between group space-y-4"
            >
              <div>
                {/* Card Top: Coin badge & Network */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                        ${asset.token}
                      </span>
                      {asset.isReadyForFaucet && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/80 animate-pulse">
                          💧 FAUCET READY
                        </span>
                      )}
                      {asset.isReadyForSwap && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                          🔄 SWAP READY
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold font-mono text-white mt-2 group-hover:text-amber-300 transition-colors">
                      {asset.projectName}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{asset.network}</p>
                  </div>
                </div>

                {/* Details Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">Estimasi Reward:</span>
                    <p className="text-emerald-400 font-semibold">{asset.estimatedReturn}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Biaya / Modal:</span>
                    <p className="text-slate-300 font-semibold">{asset.budget}</p>
                  </div>
                </div>

                {/* Task Checklist */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    Aksi Faucet & Swaps:
                  </span>
                  <div className="space-y-1.5">
                    {asset.tasks.slice(0, 3).map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-900/60 border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {t.isFaucet ? (
                            <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : t.isSwap ? (
                            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="text-slate-300 truncate">{t.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                            t.status === "ready" || t.status === "operational"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                <a
                  href={asset.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <span>Buka Portal DApp / Faucet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <Link
                  href="/command"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Eksekusi di Command Center"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

