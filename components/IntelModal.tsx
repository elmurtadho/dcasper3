"use client";

import React, { useState } from "react";
import { Project, IntelData } from "@/lib/supabaseClient";
import {
  X,
  Zap,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Coins,
  Wallet,
  Globe,
  CheckCircle2,
  Clock,
  Code2,
  Activity,
  DollarSign,
  Layers,
} from "lucide-react";

interface IntelModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onPromoteToCommand: (projectId: string) => Promise<void>;
  onIgnoreProject: (projectId: string) => Promise<void>;
}

export const IntelModal: React.FC<IntelModalProps> = ({
  project,
  isOpen,
  onClose,
  onPromoteToCommand,
  onIgnoreProject,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);

  if (!isOpen || !project) return null;

  const intel: IntelData = project.intel_data || {};

  const handleAction = async (actionType: "active" | "ignored") => {
    setIsProcessing(true);
    try {
      if (actionType === "active") {
        await onPromoteToCommand(project.id);
      } else {
        await onIgnoreProject(project.id);
      }
      onClose();
    } catch (err) {
      console.error("Action error in IntelModal:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Structured Intel Extraction
  const networkDisplay = intel.network || intel.network_type || "Multi-Chain / EVM";
  const farmingTypeDisplay = intel.farming_type || project.type || "Automated Farming";
  const budgetDisplay =
    intel.budget_requirement ||
    (intel.capital_cost ? `Est. Capital: ${intel.capital_cost}` : "Zero Budget (Free)");
  const returnDisplay =
    intel.estimated_return ||
    (intel.reward_token ? `$${intel.reward_token} Token Rewards` : "High Value Potential");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Card / Bottom Sheet on Mobile */}
      <div
        className="relative w-full max-w-2xl bg-[#0a1020] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Top Accent Gradient */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 py-3 sm:p-6 sm:pb-4 flex items-start justify-between border-b border-slate-800/80 shrink-0">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono text-[10px] sm:text-xs font-bold">
                RADAR INTEL
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-slate-500">ID: {project.id.slice(0, 8)}...</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold font-mono text-white mt-1 tracking-tight">
              {project.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5">{project.type}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto font-mono text-xs">
          {/* Key Structured Intel 4-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Network / Chain */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Jenis Jaringan / Chain
              </span>
              <p className="text-sm font-bold text-slate-200">{networkDisplay}</p>
            </div>

            {/* 2. Farming / Airdrop Type */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Tipe Airdrop / Misi
              </span>
              <p className="text-sm font-bold text-slate-200">{farmingTypeDisplay}</p>
            </div>

            {/* 3. Budget / Capital Requirement */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Syarat Modal / Biaya
              </span>
              <p className="text-sm font-bold text-amber-300">{budgetDisplay}</p>
            </div>

            {/* 4. Reward Potential / Token */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                Estimasi Reward & Token
              </span>
              <p className="text-sm font-bold text-purple-300">{returnDisplay}</p>
            </div>
          </div>

          {/* Task Checklist */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Checklist Tugas & Validasi Otomasi
              </h4>
              <span className="text-[11px] text-slate-500">
                {intel.tasks?.length || 0} langkah terdata
              </span>
            </div>

            <div className="space-y-2">
              {intel.tasks && intel.tasks.length > 0 ? (
                intel.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-200">{task.name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                        {task.interval && <span>Interval: {task.interval}</span>}
                        {task.reward && <span className="text-emerald-400">Reward: {task.reward}</span>}
                        {task.cost && <span className="text-amber-400">Biaya: {task.cost}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/50 self-start sm:self-auto">
                      {task.status || "ready"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Belum ada rincian task individual.</p>
              )}
            </div>
          </div>

          {/* Funding & Metadata Metrics */}
          {intel.metrics && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Metrik & Profil Pendanaan
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(intel.metrics).map(([k, v]) => (
                  <div key={k} className="p-2 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase truncate">
                      {k.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate block">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official DApp URL Link & Raw JSON Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
            {intel.dashboard_url ? (
              <a
                href={intel.dashboard_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 hover:underline font-bold"
              >
                Kunjungi Portal Resmi <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-500">Tidak ada tautan portal</span>
            )}

            <button
              type="button"
              onClick={() => setShowJson(!showJson)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Code2 className="w-3.5 h-3.5" />
              {showJson ? "Sembunyikan JSON" : "Lihat Raw JSON"}
            </button>
          </div>

          {/* Collapsible JSON View */}
          {showJson && (
            <pre className="p-3.5 rounded-xl bg-[#060913] border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap max-h-48">
              {JSON.stringify(intel, null, 2)}
            </pre>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-3.5 sm:p-5 bg-[#080d19] border-t border-slate-800/80 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleAction("ignored")}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Abaikan / Buang
          </button>

          <button
            type="button"
            onClick={() => handleAction("active")}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wide bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                Tambahkan ke Command
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
