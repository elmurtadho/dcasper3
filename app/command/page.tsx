"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, Project, FarmingLog, Wallet } from "@/lib/supabaseClient";
import { StatsCards } from "@/components/StatsCards";
import { ProjectTable } from "@/components/ProjectTable";
import { LiveLogs } from "@/components/LiveLogs";
import {
  Zap,
  Radio,
  Cpu,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  ShieldAlert,
  Terminal,
  Play,
} from "lucide-react";

// Default active projects for Command Center execution
const DEFAULT_ACTIVE_PROJECTS: Project[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    name: "Grass Network (GetGrass.io)",
    type: "DePIN Bandwidth Mining",
    status: "idle",
    lifecycle_stage: "active",
    command_payload: "--task=uptime_check --report_points=true --verify_epoch",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    intel_data: {
      tier: "Tier 1 - Alpha Node",
      epoch: "Stage 2 - Epoch 3",
      score: 48250,
      reward_token: "GRASS",
      network_quality: "98%",
      dashboard_url: "https://app.getgrass.io/dashboard",
      assigned_profile_id: "862684906",
      tasks: [
        { name: "WebSocket Uptime Heartbeat", status: "operational", interval: "continuous" },
        { name: "Daily Referral Bonus Claim", status: "ready", interval: "24h" },
        { name: "IP Reputation Health Check", status: "clean", last_verified: "2026-09-14T02:00:00Z" },
      ],
      metrics: {
        uptime_hours_today: 23.4,
        bandwidth_shared_gb: 4.12,
        current_multiplier: "1.25x",
      },
      credentials_ref: "dolphin_profile_862684906",
    },
  },
  {
    id: "b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e",
    name: "Nodepay.ai Network",
    type: "AI Data Training / DePIN",
    status: "idle",
    lifecycle_stage: "active",
    command_payload: "--task=claim_daily --proof_of_connection --heartbeat",
    created_at: new Date(Date.now() - 2700000).toISOString(),
    intel_data: {
      tier: "Gold Validator Candidate",
      season: "Season 1 AI Pre-Mining",
      score: 19420,
      reward_token: "NODEPAY",
      dashboard_url: "https://app.nodepay.ai/dashboard",
      assigned_profile_id: "862684906",
      tasks: [
        { name: "Daily Mission Check-in", status: "pending_daily", interval: "24h" },
        { name: "Ping Node Verification", status: "active", interval: "10m" },
        { name: "Twitter Social Task Sync", status: "completed", interval: "once" },
      ],
      metrics: {
        today_points: 820,
        nodes_online: 3,
        latency_ms: 42,
      },
      notes: "Requires clean residential proxy or local Dolphin Anty session.",
    },
  },
];

const DEFAULT_LOGS: FarmingLog[] = [
  {
    id: "log-1",
    project_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    log_message: "Grass Network node heartbeat active. Quality score 98%, epoch points synced.",
    status: "success",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "log-2",
    project_id: "b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e",
    log_message: "Nodepay AI worker session verified on Dolphin Profile 862684906.",
    status: "info",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
  },
];

export default function CommandPage() {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_ACTIVE_PROJECTS);
  const [logs, setLogs] = useState<FarmingLog[]>(DEFAULT_LOGS);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isRealtime, setIsRealtime] = useState<boolean>(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);

  // Fetch only projects with lifecycle_stage = 'active'
  const fetchActiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Active Projects
      const { data: projData, error: projError } = await supabase
        .from("projects")
        .select("*")
        .eq("lifecycle_stage", "active")
        .order("created_at", { ascending: true });

      if (!projError && projData && projData.length > 0) {
        setProjects(projData as Project[]);
        setSupabaseConnected(true);
        setBannerNotice(null);
      } else if (!projError && projData && projData.length === 0) {
        // Table exists but no active projects yet (fallback to active seed or empty)
        setSupabaseConnected(true);
        // If empty, check if unclassified projects exist
        const { data: allProj } = await supabase.from("projects").select("*");
        if (allProj && allProj.length > 0) {
          const activeSubset = allProj.filter(
            (p) => p.lifecycle_stage === "active" || p.name.includes("Grass") || p.name.includes("Nodepay")
          );
          if (activeSubset.length > 0) setProjects(activeSubset as Project[]);
        }
      } else if (projError) {
        // Table may not have lifecycle_stage yet
        setSupabaseConnected(false);
        if (projError.message?.includes("lifecycle_stage") || projError.code === "42703") {
          setBannerNotice(
            "Kolom 'lifecycle_stage' belum terdeteksi. Jalankan migration.sql di Supabase SQL Editor."
          );
        }
      }

      // 2. Fetch Logs
      const { data: logData, error: logError } = await supabase
        .from("farming_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (!logError && logData && logData.length > 0) {
        setLogs(logData as FarmingLog[]);
      }

      // 3. Fetch Wallets
      const { data: walletData } = await supabase.from("wallets").select("*");
      if (walletData) {
        setWallets(walletData as Wallet[]);
      }
    } catch (err) {
      console.warn("Command Center data fetch notice:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveData();

    // Supabase Realtime channel
    const channel = supabase
      .channel("command-db-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          fetchActiveData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "farming_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as FarmingLog, ...prev.slice(0, 49)]);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtime(true);
        }
      });

    // Fallback polling
    const interval = setInterval(fetchActiveData, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchActiveData]);

  // Execute Action: Sets status to 'pending_execution' and saves command_payload
  const handleExecute = async (projectId: string, commandPayload: string) => {
    setExecutingId(projectId);

    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              command_payload: commandPayload,
              status: "pending_execution",
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    const now = new Date().toISOString();
    const newLogItem: FarmingLog = {
      id: "opt-" + Date.now(),
      project_id: projectId,
      log_message: `Command queued: "${commandPayload || "--task=default"}" -> Dolphin Profile 862684906`,
      status: "info",
      timestamp: now,
    };
    setLogs((prev) => [newLogItem, ...prev]);

    try {
      // 1. Update Supabase 'projects' table
      await supabase
        .from("projects")
        .update({
          command_payload: commandPayload,
          status: "pending_execution",
          updated_at: now,
        })
        .eq("id", projectId);

      // 2. Record to 'farming_logs' table
      await supabase.from("farming_logs").insert({
        project_id: projectId,
        log_message: `Manual dispatch via Command Center: "${commandPayload}"`,
        status: "info",
        timestamp: now,
      });
    } catch (err) {
      console.error("Execution dispatch error:", err);
    } finally {
      setExecutingId(null);
    }
  };

  // Run All Action: Queues ALL active projects into 'pending_execution' in 1 click
  const handleRunAll = async () => {
    if (projects.length === 0 || isRunningAll) return;
    setIsRunningAll(true);

    const now = new Date().toISOString();

    // Optimistic UI update: Mark all active projects as pending_execution
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        status: "pending_execution",
        command_payload: p.command_payload || "--task=default --profile=862684906",
        updated_at: now,
      }))
    );

    const newLogItem: FarmingLog = {
      id: "opt-run-all-" + Date.now(),
      project_id: projects[0]?.id || "batch-all",
      log_message: `⚡ RUN ALL EXECUTED: Menjalankan antrean ${projects.length} project secara otomatis via Dolphin Anty Profile 862684906.`,
      status: "info",
      timestamp: now,
    };
    setLogs((prev) => [newLogItem, ...prev]);

    try {
      // 1. Batch update all active projects to pending_execution in Supabase
      const { error: batchErr } = await supabase
        .from("projects")
        .update({
          status: "pending_execution",
          updated_at: now,
        })
        .eq("lifecycle_stage", "active");

      if (batchErr) {
        console.error("Batch update error:", batchErr);
      }

      // 2. Insert execution log
      await supabase.from("farming_logs").insert({
        project_id: projects[0]?.id || "batch-run",
        log_message: `Batch Run All disinkronkan ke Supabase untuk ${projects.length} project.`,
        status: "success",
        timestamp: now,
      });
    } catch (err) {
      console.error("Run all error:", err);
    } finally {
      setTimeout(() => setIsRunningAll(false), 1200);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white uppercase">
                  Command Center
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  EXECUTION PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ruang eksekusi otomatisasi browser Dolphin Anty dan worker bot Playwright.
              </p>
            </div>
          </div>
        </div>

        {/* Action & Telemetry Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunAll}
            disabled={isLoading || isRunningAll || projects.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunningAll ? "QUEUEING ALL..." : "⚡ RUN ALL PROJECTS"}</span>
          </button>

          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Radar Intel</span>
          </Link>

          <button
            type="button"
            onClick={fetchActiveData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Migration Notice (if needed) */}
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

      {/* 1. HUD Stats Overview Cards */}
      <StatsCards projects={projects} logs={logs} isRealtime={isRealtime} />

      {/* 2. Interactive Execution Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Active Automation Projects ({projects.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Dolphin Profile: 862684906 (Ready)
          </span>
        </div>

        <ProjectTable
          projects={projects}
          onExecute={handleExecute}
          executingId={executingId}
          onRunAll={handleRunAll}
          isRunningAll={isRunningAll}
        />
      </section>

      {/* 3. Live Streaming Farming Logs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Telemetry Logs Console
          </h3>
        </div>

        <LiveLogs
          logs={logs}
          projects={projects}
          onRefresh={fetchActiveData}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
