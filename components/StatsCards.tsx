import React from "react";
import { Layers, Bot, Wallet, Terminal, Activity } from "lucide-react";
import { Project, FarmingLog } from "@/lib/supabaseClient";

interface StatsCardsProps {
  projects: Project[];
  logs: FarmingLog[];
  isRealtime: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ projects, logs, isRealtime }) => {
  const totalProjects = projects.length;
  const pendingOrRunning = projects.filter(
    (p) => p.status === "pending_execution" || p.status === "running"
  ).length;
  const idleCount = projects.filter((p) => p.status === "idle").length;
  const totalLogs = logs.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Projects */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Projects</p>
            <h3 className="text-3xl font-bold text-white mt-1 tracking-tight font-mono">{totalProjects}</h3>
            <p className="text-xs text-slate-500 mt-1">Monitored Web3 protocols</p>
          </div>
          <div className="p-3 bg-cyan-950/60 border border-cyan-800/40 rounded-lg text-cyan-400 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Execution Queue */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all rounded-xl p-5 relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1 h-full ${pendingOrRunning > 0 ? "bg-amber-500 animate-pulse" : "bg-slate-700"}`}></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Active Queue</p>
            <h3 className="text-3xl font-bold text-white mt-1 tracking-tight font-mono">
              <span className={pendingOrRunning > 0 ? "text-amber-400 font-semibold" : "text-slate-300"}>
                {pendingOrRunning}
              </span>
              <span className="text-sm text-slate-500 font-normal ml-1">in queue</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Pending or Running bots</p>
          </div>
          <div className={`p-3 rounded-lg border transition-transform group-hover:scale-105 ${
            pendingOrRunning > 0
              ? "bg-amber-950/60 border-amber-800/40 text-amber-400 animate-pulse"
              : "bg-slate-800/60 border-slate-700/40 text-slate-400"
          }`}>
            <Bot className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Idle / Ready */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">System State</p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-1 tracking-tight font-mono">
              {idleCount} <span className="text-sm font-normal text-slate-500">Standby</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Dolphin Profile 862684906</p>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Telemetry / Logs */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Telemetry</p>
            <h3 className="text-3xl font-bold text-white mt-1 tracking-tight font-mono">{totalLogs}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {isRealtime ? (
                <span className="text-emerald-400 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live sync active
                </span>
              ) : (
                "Poll sync (5s)"
              )}
            </p>
          </div>
          <div className="p-3 bg-purple-950/60 border border-purple-800/40 rounded-lg text-purple-400 group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
