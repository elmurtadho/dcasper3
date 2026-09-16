import React, { useState } from "react";
import { Project } from "@/lib/supabaseClient";
import { IntelAccordion } from "./IntelAccordion";
import {
  ChevronDown,
  ChevronRight,
  Play,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Sparkles,
} from "lucide-react";

interface ProjectTableProps {
  projects: Project[];
  onExecute: (projectId: string, commandPayload: string) => Promise<void>;
  executingId: string | null;
  onRunAll?: () => Promise<void>;
  isRunningAll?: boolean;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onExecute,
  executingId,
  onRunAll,
  isRunningAll = false,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    // Expand first project by default for instant visual intel
    [projects[0]?.id || ""]: true,
  });

  const [inputPayloads, setInputPayloads] = useState<Record<string, string>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (id: string, value: string) => {
    setInputPayloads((prev) => ({ ...prev, [id]: value }));
  };

  const handleExecute = async (project: Project, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = inputPayloads[project.id] ?? project.command_payload ?? "";
    await onExecute(project.id, payload);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_execution":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            pending_execution
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            running
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/70 text-rose-300 border border-rose-700/60">
            <AlertOctagon className="w-3.5 h-3.5" />
            failed
          </span>
        );
      case "idle":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            idle
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#070b16] overflow-hidden shadow-2xl">
      {/* Table Header Section */}
      <div className="px-4 sm:px-6 py-4 bg-[#0a0f1f] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            Active Web3 Intelligence Projects
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any row to expand deep intelligence data and execute automated bot tasks.
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {onRunAll && (
            <button
              type="button"
              onClick={onRunAll}
              disabled={isRunningAll || projects.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isRunningAll ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isRunningAll ? "Running All..." : "Run All"}</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-slate-400 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Profile 862684906</span>
          </div>
        </div>
      </div>

      {/* Projects List / Table Rows */}
      <div className="divide-y divide-slate-800/80">
        {projects.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-sm">
            No projects found in database. Run schema.sql in Supabase to initialize seed data.
          </div>
        ) : (
          projects.map((project) => {
            const isExpanded = !!expandedRows[project.id];
            const isExecuting = executingId === project.id;
            const currentInputValue =
              inputPayloads[project.id] !== undefined
                ? inputPayloads[project.id]
                : project.command_payload || "";

            return (
              <div
                key={project.id}
                className="transition-colors hover:bg-slate-900/30 group"
              >
                {/* Main Interactive Row Header */}
                <div
                  onClick={() => toggleRow(project.id)}
                  className="px-4 sm:px-6 py-4 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 select-none"
                >
                  {/* Left: Expand Icon + Name & Type */}
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 sm:min-w-[260px]">
                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors mt-0.5 sm:mt-0 shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors text-sm sm:text-base tracking-tight truncate">
                          {project.name}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-400 border border-slate-700/60 shrink-0">
                          {project.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ID: <span className="text-slate-400">{project.id.slice(0, 13)}...</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle: Live Status Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-center">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  {/* Right: Command Terminal Bar (Input + Execute Button) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 max-w-xl w-full"
                  >
                    <form
                      onSubmit={(e) => handleExecute(project, e)}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1 min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          value={currentInputValue}
                          onChange={(e) => handleInputChange(project.id, e.target.value)}
                          placeholder="Command... e.g. --task=daily_claim"
                          className="w-full pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 bg-[#050811] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 transition-all outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isExecuting || project.status === "pending_execution"}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-md ${
                          project.status === "pending_execution"
                            ? "bg-amber-950/60 text-amber-400 border border-amber-800/80 cursor-not-allowed opacity-80"
                            : isExecuting
                            ? "bg-cyan-900 text-cyan-300 border border-cyan-700 cursor-wait"
                            : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95"
                        }`}
                      >
                        {isExecuting ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden xs:inline">Sending...</span>
                          </>
                        ) : project.status === "pending_execution" ? (
                          <>
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span className="hidden xs:inline">Queued</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Run</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Expandable Accordion: Intel Data */}
                {isExpanded && (
                  <div className="border-t border-slate-800/60 bg-[#070b16]">
                    <IntelAccordion intel={project.intel_data || {}} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
