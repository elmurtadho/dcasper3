"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithPasskey, isAuthenticated, ADMIN_PASSKEY } from "@/lib/auth";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Terminal,
  Zap,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [passkey, setPasskey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedHint, setCopiedHint] = useState(false);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginWithPasskey(passkey);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.replace("/");
        }, 800);
      } else {
        setError(result.error || "Akses ditolak: Passkey tidak valid.");
        setIsLoading(false);
      }
    }, 500);
  };

  const handleFillPasskey = () => {
    setPasskey(ADMIN_PASSKEY);
    setError(null);
    setCopiedHint(true);
    setTimeout(() => setCopiedHint(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-3 sm:px-4 py-8 sm:py-12 relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Cyber Grid / Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-[#0c1222]/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-8 space-y-5 sm:space-y-6 z-10 transition-all duration-300 hover:border-cyan-500/40">
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-t-2xl" />

        {/* Branding & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wider uppercase">
            RESTRICTED ACCESS
          </h1>
          <p className="text-xs font-mono text-slate-400 tracking-wide">
            WEB3 COMMAND CENTER // OPERATOR PORTAL
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-center gap-2.5 animate-shake shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono flex items-center gap-2.5 shadow-lg">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Passkey terverifikasi. Membuka Command Center...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Master Operator Passkey
              </span>
              <span className="text-[10px] text-slate-500">AES-256</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey (e.g. dcasper-admin-2026)"
                disabled={isLoading || isSuccess}
                autoFocus
                className="w-full pl-3.5 pr-10 py-3 bg-[#060a14] border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`w-full py-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
              isSuccess
                ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                : isLoading
                ? "bg-cyan-900 text-cyan-300 border border-cyan-700 cursor-wait"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            }`}
          >
            {isSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                SESSION AUTHORIZED
              </>
            ) : isLoading ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                AUTHORIZE OPERATOR ACCESS
              </>
            )}
          </button>
        </form>

        {/* Quick Operator Hint Bar */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="space-y-0.5 text-slate-400 truncate">
              <span className="text-slate-500 block text-[10px] uppercase">Default Operator Passkey:</span>
              <code className="text-cyan-400 font-semibold">{ADMIN_PASSKEY}</code>
            </div>
            <button
              type="button"
              onClick={handleFillPasskey}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 flex items-center gap-1 transition-colors active:scale-95"
            >
              {copiedHint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHint ? "Filled" : "Auto Fill"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Telemetry Note */}
      <div className="mt-8 text-center text-xs font-mono text-slate-500 space-y-1">
        <p>SECURED WITH DOLPHIN ANTY AUTOMATION ARCHITECTURE</p>
        <p className="text-[10px] text-slate-600">
          Single-Operator Instance // All Unauthorized Attempts Are Logged
        </p>
      </div>
    </div>
  );
}
