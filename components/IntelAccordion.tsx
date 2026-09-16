import React, { useState } from "react";
import { IntelData } from "@/lib/supabaseClient";
import { CheckCircle2, Clock, AlertCircle, ExternalLink, Cpu, ShieldCheck, Database, Code2 } from "lucide-react";

interface IntelAccordionProps {
  intel: IntelData;
}

export const IntelAccordion: React.FC<IntelAccordionProps> = ({ intel }) => {
  const [showJson, setShowJson] = useState(false);

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
      case "ready":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            {status}
          </span>
        );
      case "cooling_down":
      case "pending_daily":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/50">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            <AlertCircle className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-3.5 sm:p-5 bg-[#0a0f1d] border-t border-slate-800/80 space-y-4 sm:space-y-5">
      {/* Top Meta Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex flex-wrap items-center gap-2">
          {intel.tier && (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              {intel.tier}
            </span>
          )}
          {intel.epoch && (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/50 text-purple-300 border border-purple-800/60">
              {intel.epoch}
            </span>
          )}
          {intel.season && (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/50 text-purple-300 border border-purple-800/60">
              {intel.season}
            </span>
          )}
          {intel.reward_token && (
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
              Token: ${intel.reward_token}
            </span>
          )}
          {intel.score !== undefined && (
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800/80 text-amber-300 border border-slate-700">
              Accumulated Score: {intel.score.toLocaleString()} pts
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {intel.dashboard_url && (
            <a
              href={intel.dashboard_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline font-mono"
            >
              Open DApp <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showJson ? "Hide JSON" : "Raw JSON"}
          </button>
        </div>
      </div>

      {/* Main Grid: Tasks & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Intelligence Task Verification */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Automated Task Checklist
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              {intel.tasks?.length || 0} scheduled
            </span>
          </div>

          <div className="space-y-2">
            {intel.tasks && intel.tasks.length > 0 ? (
              intel.tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded bg-slate-950/70 border border-slate-800/80 text-xs gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-200">{task.name}</span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                      {task.interval && <span>Interval: {task.interval}</span>}
                      {task.reward && <span className="text-emerald-400">Reward: {task.reward}</span>}
                      {task.cooldown_hrs && (
                        <span className="text-amber-400">Cooldown: {task.cooldown_hrs}h</span>
                      )}
                    </div>
                  </div>
                  <div className="self-start sm:self-auto">{getTaskStatusBadge(task.status)}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No automated tasks defined in payload.</p>
            )}
          </div>
        </div>

        {/* Right: Live Telemetry Metrics & Assignment */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800 space-y-4">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Telemetry & Node State
            </h4>

            {intel.metrics ? (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(intel.metrics).map(([key, value]) => (
                  <div key={key} className="p-2 bg-slate-950/70 rounded border border-slate-800/80">
                    <p className="text-[10px] font-mono uppercase text-slate-500 truncate">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-mono font-semibold text-slate-200 mt-0.5">{String(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No telemetry metrics logged yet.</p>
            )}
          </div>

          {/* Assigned Worker / Wallet */}
          <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Dolphin Profile ID:</span>
              <span className="text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {intel.assigned_profile_id || "862684906 (Default)"}
              </span>
            </div>
            {intel.assigned_wallet && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Assigned Wallet:</span>
                <span className="text-slate-300 truncate max-w-[200px]" title={intel.assigned_wallet}>
                  {intel.assigned_wallet}
                </span>
              </div>
            )}
            {intel.notes && (
              <div className="mt-2 p-2 bg-amber-950/20 border border-amber-900/40 rounded text-amber-300/90 text-[11px]">
                <strong>Note:</strong> {intel.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Raw JSON Viewer */}
      {showJson && (
        <div className="rounded-lg border border-slate-800 bg-[#060a14] p-4 text-xs font-mono text-cyan-300 overflow-x-auto">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-slate-400">
            <span>Raw intel_data (JSONB)</span>
            <span className="text-[10px]">PostgreSQL JSONB View</span>
          </div>
          <pre className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
            {JSON.stringify(intel, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
