import React, { useState } from "react";
import { FarmingLog, Project } from "@/lib/supabaseClient";
import { Terminal, Shield, RefreshCw, AlertTriangle, CheckCircle, Info, Bug } from "lucide-react";

interface LiveLogsProps {
  logs: FarmingLog[];
  projects: Project[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const LiveLogs: React.FC<LiveLogsProps> = ({ logs, projects, onRefresh, isLoading }) => {
  const [filter, setFilter] = useState<string>("all");

  const projectMap = React.useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "error":
        return <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#050914] overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#090e1f] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-medium text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>FARMING_TELEMETRY_LOGS</span>
            <span className="text-slate-500">:: public.farming_logs</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 text-[11px] font-mono">
            {["all", "success", "info", "warning", "error"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  filter === type
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Log Console Output */}
      <div className="p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-2 bg-[#050914]">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 py-6 text-center italic">
            [SYS_IDLE] No telemetry logs found matching filter criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const projectName = projectMap.get(log.project_id) || "Global Automation";
            const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1.5 rounded transition-colors group"
              >
                <span className="text-slate-500 shrink-0 select-none">[{formattedTime}]</span>
                <span className="shrink-0 mt-0.5">{getStatusIcon(log.status)}</span>
                <span className="text-cyan-400 font-semibold shrink-0 group-hover:underline">
                  [{projectName}]:
                </span>
                <span className="text-slate-300 break-all">{log.log_message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className="px-4 py-2 bg-[#090e1f]/70 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Dolphin Anty Local Broker: 127.0.0.1:3001</span>
        </div>
        <div>
          <span>Showing {filteredLogs.length} of {logs.length} telemetry records</span>
        </div>
      </div>
    </div>
  );
};
