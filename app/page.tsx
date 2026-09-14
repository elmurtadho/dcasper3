"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, Project } from "@/lib/supabaseClient";
import { IntelModal } from "@/components/IntelModal";
import {
  Radio,
  Zap,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Coins,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

// Default seed scouted projects in case database migration is pending
const DEFAULT_SCOUTED_FALLBACK: Project[] = [
  {
    id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    name: "Berachain Artio (PoL Testnet)",
    type: "EVM L1 Proof-of-Liquidity",
    status: "idle",
    lifecycle_stage: "scouted",
    command_payload: "--task=faucet_claim --swap_honey --mint_bgt",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    intel_data: {
      tier: "Tier 1 - High Value Alpha",
      network: "Berachain Bartio (Chain ID: 80084)",
      network_type: "EVM Cosmos-SDK",
      budget_requirement: "Zero Budget (Free Faucet)",
      capital_cost: "0 USD",
      farming_type: "DEX Swap & Liquidity Minting",
      reward_token: "BERA / BGT",
      estimated_return: "$1,500 - $4,000",
      dashboard_url: "https://artio.faucet.berachain.com",
      assigned_profile_id: "862684906",
      tasks: [
        { name: "Request 0.1 BERA from Testnet Faucet", status: "ready", interval: "8h" },
        { name: "BEX Swap BERA -> HONEY Stablecoin", status: "ready", type: "dex_interaction" },
        { name: "Bend Deposit HONEY to Mint BGT", status: "pending", type: "yield_farming" },
      ],
      metrics: {
        backed_funding: "$142M",
        lead_investors: "Polychain, Brevan Howard, Framework",
        ecosystem_status: "Pre-Mainnet Stage",
      },
    },
  },
  {
    id: "c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f",
    name: "Monad Ecosystem Testnet",
    type: "EVM L1 Airdrop Campaign",
    status: "idle",
    lifecycle_stage: "scouted",
    command_payload: "--task=faucet_request --execute_dex_swap --amount=0.05",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    intel_data: {
      tier: "Early Testnet Participant",
      network: "Monad Testnet (Chain ID: 10143)",
      network_type: "High-Throughput EVM",
      budget_requirement: "Zero Budget (Free Faucet)",
      capital_cost: "0 USD",
      farming_type: "Testnet Faucet & Smart Contracts",
      reward_token: "MON",
      estimated_return: "$2,000+",
      dashboard_url: "https://monad.xyz/ecosystem",
      assigned_profile_id: "862684906",
      tasks: [
        { name: "Claim MON Testnet Faucet", status: "cooling_down", cooldown_hrs: 6 },
        { name: "MonadSwap Liquidity Interaction", status: "ready", type: "contract_call" },
        { name: "Deploy Test Token Contract", status: "completed", tx_hash: "0x3f1c9...89b" },
      ],
      metrics: {
        tx_count: 87,
        unique_contract_interactions: 14,
        estimated_gas_spent_mon: "1.42",
      },
    },
  },
  {
    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    name: "Scroll Canvas (ZK-Rollup Badges)",
    type: "Ethereum ZK-Rollup L2",
    status: "idle",
    lifecycle_stage: "scouted",
    command_payload: "--task=mint_canvas_profile --verify_attestations",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    intel_data: {
      tier: "Tier 2 - Identity Farming",
      network: "Scroll Mainnet (Chain ID: 534352)",
      network_type: "EVM zkEVM",
      budget_requirement: "Micro Gas (~$1 - $2 ETH)",
      capital_cost: "Low (~$2.00)",
      farming_type: "On-chain Attestations & Badges",
      reward_token: "SCR",
      estimated_return: "$500 - $1,200",
      dashboard_url: "https://scroll.io/canvas",
      assigned_profile_id: "862684906",
      tasks: [
        { name: "Mint Scroll Canvas Profile NFT", status: "ready", cost: "0.0003 ETH" },
        { name: "Claim Ethereum Year Badge Attestation", status: "ready", interval: "once" },
        { name: "Gitcoin Passport Score Verification", status: "completed", score: "24.5" },
      ],
      metrics: {
        total_marks: 2840,
        canvas_rank: "Top 8%",
        network_gas_gwei: "0.04",
      },
    },
  },
  {
    id: "a7b8c9d0-e1f2-4a3b-5c6d-7e8f9a0b1c2d",
    name: "Eclipse SVM Mainnet Launch",
    type: "SVM L2 on Ethereum",
    status: "idle",
    lifecycle_stage: "scouted",
    command_payload: "--task=bridge_eth --swap_lifinity_svm",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    intel_data: {
      tier: "Tier 1 - High Conviction",
      network: "Eclipse Mainnet",
      network_type: "Solana Virtual Machine (SVM)",
      budget_requirement: "Bridge Capital ($10 - $50)",
      capital_cost: "Flexible ($10+)",
      farming_type: "Bridge & DEX Volume Generation",
      reward_token: "ECLIPSE",
      estimated_return: "$2,000 - $5,000",
      dashboard_url: "https://eclipse.builders",
      assigned_profile_id: "862684906",
      tasks: [
        { name: "Bridge 0.01 ETH from Ethereum Mainnet", status: "ready", type: "bridge" },
        { name: "Execute 5 DEX Swaps on Lifinity SVM", status: "pending", interval: "weekly" },
        { name: "Deploy Turbo SVM Smart Contract", status: "ready", type: "developer_task" },
      ],
      metrics: {
        backed_funding: "$65M",
        lead_investors: "Placeholder, Hack VC, Polychain",
        tps_capacity: "40,000 TPS",
      },
    },
  },
];

export default function IntelRadarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isScanningRadar, setIsScanningRadar] = useState<boolean>(false);
  const [radarScanFeedback, setRadarScanFeedback] = useState<string | null>(null);

  // Fetch only projects with lifecycle_stage = 'scouted'
  const fetchScoutedProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Query projects where lifecycle_stage is 'scouted'
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("lifecycle_stage", "scouted")
        .order("created_at", { ascending: false });

      if (!error && data !== null) {
        setProjects(data as Project[]);
        setBannerNotice(null);
      } else if (error) {
        console.warn("Supabase query notice:", error);
        // Column may not exist yet if migration.sql hasn't been run
        if (error.message?.includes("lifecycle_stage") || error.code === "42703") {
          setBannerNotice(
            "Kolom 'lifecycle_stage' belum terdeteksi di Supabase. Jalankan file migration.sql di SQL Editor untuk sinkronisasi cloud."
          );
        }
      }
    } catch (err) {
      console.warn("Fetch scouted projects error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Autonomous cloud Radar Scanner trigger
  const handleTriggerRadarScan = async () => {
    setIsScanningRadar(true);
    setRadarScanFeedback("📡 Memindai garapan airdrop baru & memeriksa jadwal reminder...");
    try {
      const res = await fetch("/api/radar/scan", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        if (result.newDiscoveredCount > 0) {
          setRadarScanFeedback(`✅ Ditemukan ${result.newDiscoveredCount} airdrop baru! Notifikasi dan embed terkirim ke Discord.`);
        } else {
          setRadarScanFeedback("✅ Radar diperiksa: '0 new project detected' terkirim ke Discord.");
        }
        await fetchScoutedProjects();
      } else {
        setRadarScanFeedback("⚠️ Gagal memindai radar: " + (result.error || "Unknown"));
      }
    } catch (err: any) {
      setRadarScanFeedback("⚠️ Error radar: " + err.message);
    } finally {
      setIsScanningRadar(false);
      setTimeout(() => setRadarScanFeedback(null), 6000);
    }
  };

  useEffect(() => {
    fetchScoutedProjects();

    // Autonomous background scan every 10 minutes while dashboard is open (no terminal needed)
    const autoInterval = setInterval(() => {
      fetch("/api/radar/scan", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d?.newDiscoveredCount > 0) {
            fetchScoutedProjects();
          }
        })
        .catch(() => {});
    }, 600000);

    return () => clearInterval(autoInterval);
  }, [fetchScoutedProjects]);

  // Modal Trigger
  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Action a: Promote to Command Center (lifecycle_stage = 'active')
  const handlePromoteToCommand = async (projectId: string) => {
    // 1. Optimistic UI update: remove from radar view immediately
    const target = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    try {
      const now = new Date().toISOString();
      await supabase
        .from("projects")
        .update({
          lifecycle_stage: "active",
          updated_at: now,
        })
        .eq("id", projectId);

      // Record telemetry log in farming_logs
      await supabase.from("farming_logs").insert({
        project_id: projectId,
        log_message: `Radar Promotion: [${target?.name || projectId}] ditambahkan ke Command Center untuk eksekusi otomatis.`,
        status: "success",
        timestamp: now,
      });
    } catch (err) {
      console.error("Promote action error:", err);
    }
  };

  // Action b: Ignore Project (lifecycle_stage = 'ignored')
  const handleIgnoreProject = async (projectId: string) => {
    // 1. Optimistic UI update: remove from radar view immediately
    const target = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    try {
      const now = new Date().toISOString();
      await supabase
        .from("projects")
        .update({
          lifecycle_stage: "ignored",
          updated_at: now,
        })
        .eq("id", projectId);

      // Record telemetry log in farming_logs
      await supabase.from("farming_logs").insert({
        project_id: projectId,
        log_message: `Radar Filter: [${target?.name || projectId}] diabaikan / dibuang dari antrean radar.`,
        status: "info",
        timestamp: now,
      });
    } catch (err) {
      console.error("Ignore action error:", err);
    }
  };

  // Filter & Search
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.intel_data?.network &&
        String(p.intel_data.network).toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterCategory === "all") return true;
    if (filterCategory === "zero_budget") {
      const budget = (p.intel_data?.budget_requirement || "").toLowerCase();
      return budget.includes("zero") || budget.includes("free");
    }
    if (filterCategory === "evm") {
      const net = (p.intel_data?.network || p.intel_data?.network_type || "").toLowerCase();
      return net.includes("evm") || net.includes("ethereum");
    }
    if (filterCategory === "l2") {
      const type = (p.type + " " + (p.intel_data?.network || "")).toLowerCase();
      return type.includes("l2") || type.includes("rollup") || type.includes("svm");
    }
    return true;
  });

  const zeroBudgetCount = projects.filter((p) =>
    (p.intel_data?.budget_requirement || "").toLowerCase().includes("zero")
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white uppercase">
                  Intel Radar
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  ALPHA SORTING HUB
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Sortir proyek scouted Web3, verifikasi intelijen, lalu tambahkan ke Command Center.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerRadarScan}
            disabled={isScanningRadar}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950 to-slate-900 hover:from-cyan-900 hover:to-slate-800 text-cyan-300 border border-cyan-700/80 text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all active:scale-95 disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${isScanningRadar ? "animate-spin text-cyan-400" : "animate-pulse text-cyan-400"}`} />
            <span>{isScanningRadar ? "Scanning Airdrops..." : "📡 Scan Radar & Discord"}</span>
          </button>

          <button
            type="button"
            onClick={fetchScoutedProjects}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            Refresh
          </button>

          <Link
            href="/command"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buka Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Radar Scan Autonomous Feedback Notification */}
      {radarScanFeedback && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-800/90 text-cyan-200 text-xs font-mono flex items-center gap-2.5 animate-fadeIn shadow-lg">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <span>{radarScanFeedback}</span>
        </div>
      )}

      {/* Migration Notice Banner (if migration.sql is pending in Supabase) */}
      {bannerNotice && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/70 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <a
            href="https://supabase.com/dashboard/project/udnyimtjrfbetxpgvegw/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 border border-amber-700/60 shrink-0 flex items-center gap-1.5 transition-colors"
          >
            Buka SQL Editor <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Stats HUD Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Scouted */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Proyek Siap Sortir
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
              {projects.length} Proyek
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Zero Budget / Free */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Zero Budget / Faucet
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {zeroBudgetCount} Peluang
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Pipeline Ready */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Status Bot Dolphin
            </span>
            <span className="text-2xl font-bold font-mono text-slate-200 mt-1 block">
              Standby (3001)
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari airdrop, network, atau nama..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Semua" },
            { id: "zero_budget", label: "Zero Budget" },
            { id: "evm", label: "EVM Chains" },
            { id: "l2", label: "L2 / SVM" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-mono transition-all whitespace-nowrap ${
                filterCategory === cat.id
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scouted Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 rounded-2xl border border-slate-800 bg-[#060913] text-center space-y-3 font-mono">
            <Radio className="w-8 h-8 mx-auto text-cyan-400 animate-pulse" />
            <p className="text-xs text-slate-400">Memindai data Intel Radar dari database Supabase...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full p-12 rounded-2xl border border-slate-800 bg-[#060913] text-center space-y-4 font-mono">
            <div className="p-3 rounded-2xl bg-slate-900 inline-block text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">Radar Intel Bersih! (0 Proyek Siap Sortir)</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Seluruh proyek scouted telah berhasil Anda tambahkan ke Command Center atau diarsipkan. Proyek baru yang terdeteksi oleh scanner otomatis akan muncul di sini.
              </p>
            </div>
            <Link
              href="/command"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              Buka Command Center ({projects.length === 0 ? "7 Proyek Aktif" : "Eksekusi Bot"}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const intel = project.intel_data || {};
            const budget = intel.budget_requirement || (intel.capital_cost ? `Biaya: ${intel.capital_cost}` : "Zero Budget");
            const isZeroBudget = budget.toLowerCase().includes("zero") || budget.toLowerCase().includes("free");

            return (
              <div
                key={project.id}
                onClick={() => handleOpenModal(project)}
                className="group relative p-5 rounded-2xl bg-[#090e1c]/90 hover:bg-[#0c1426] border border-slate-800/90 hover:border-cyan-500/50 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between space-y-5"
              >
                {/* Top Row: Name & Protocol Type */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {project.type}
                      </span>
                      <h3 className="text-lg font-bold font-mono text-white group-hover:text-cyan-300 transition-colors mt-1.5 tracking-tight">
                        {project.name}
                      </h3>
                    </div>

                    <span className="p-2 rounded-xl bg-slate-900 group-hover:bg-cyan-950 text-slate-400 group-hover:text-cyan-400 border border-slate-800 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Network & Reward Preview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                    {intel.network && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                        {intel.network}
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        isZeroBudget
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/60"
                      }`}
                    >
                      {budget}
                    </span>

                    {intel.reward_token && (
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 text-[11px] font-bold">
                        ${intel.reward_token}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Tasks & Inspect Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">
                    {intel.tasks?.length || 0} tugas terkonfigurasi
                  </span>

                  <span className="text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 font-bold">
                    Periksa & Sortir Intel <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Overlay Component */}
      <IntelModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPromoteToCommand={handlePromoteToCommand}
        onIgnoreProject={handleIgnoreProject}
      />
    </div>
  );
}
