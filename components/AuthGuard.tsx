"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Shield, ShieldAlert, Cpu } from "lucide-react";

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = isAuthenticated();
    if (!authStatus) {
      setIsAuthorized(false);
      router.replace("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Loading / Scanning State while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-4">
        <div className="relative p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center max-w-sm w-full text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm -z-10 animate-ping"></div>
          </div>
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
            VERIFYING OPERATOR ACCESS
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Scanning biometric & cryptographic session...
          </p>
        </div>
      </div>
    );
  }

  // Not authorized (briefly visible before router.replace takes over)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
        <div className="text-center font-mono space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
          <p className="text-rose-400 text-sm font-bold uppercase tracking-widest">
            ACCESS RESTRICTED // REDIRECTING TO LOGIN
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
