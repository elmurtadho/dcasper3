"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface ProjectCard {
  name: string;
  type: string;
  token: string;
  url: string;
  network: string;
  funding: string;
  guide: string;
  tier: string;
  budget: string;
  return: string;
  tag: "COMMAND" | "RADAR" | "IGNORED" | "NEW";
  tagLabel: string;
  inDb: boolean;
  dbStage: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  projects?: ProjectCard[];
  webAnalysis?: any;
}

export default function IntelChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Halo Operator! Saya adalah **Agen Intel dCasper3 (Professional Web Researcher)**.\n\n" +
        "Saya dapat membantu Anda:\n" +
        "1. 🌐 **Membuka & menganalisis website live**: Tempelkan URL web dApp/airdrop apa pun untuk saya bedah struktur faucet, DEX, dan airdrop-nya.\n" +
        "2. 🏷️ **Tagging Otomatis**: Setiap proyek yang dibahas langsung dicek ke database dCasper3 apakah sudah ada di Command Center (`active`), Intel Radar (`scouted`), atau belum terjaring (`new`).\n" +
        "3. ⚡ **1-Ketuk Jaring ke Dasbor**: Temukan airdrop baru dan jaring langsung ke dasbor dCasper3 dengan satu klik tombol di bawah kartu proyek!\n" +
        "4. 🪙 **Panduan Eksekusi & Edukasi**: Tanya apa saja seputar dompet Web3, jadwal cooldown faucet, dan cara swap.",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/intel/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses pesan");

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Analisis intelijen selesai.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        projects: data.projects || [],
        webAnalysis: data.webAnalysis,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Maaf, terjadi kesalahan: ${err.message}`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (project: ProjectCard, targetStage: "scouted" | "active") => {
    const actionKey = `${project.name}-${targetStage}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch("/api/intel/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "capture_project",
          targetStage,
          projectData: {
            name: project.name,
            type: project.type,
            tier: project.tier,
            network: project.network,
            budget_requirement: project.budget,
            reward_token: project.token,
            estimated_return: project.return,
            url: project.url,
            command_payload: `--task=claim_daily --project="${project.name}"`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menjaring proyek");

      setNotification(`✅ Berhasil menjaring ${project.name} ke ${targetStage === "active" ? "Command Center" : "Intel Radar"}!`);
      setTimeout(() => setNotification(null), 4000);

      // Update project tags in UI messages
      setMessages((prev) =>
        prev.map((m) => {
          if (!m.projects) return m;
          return {
            ...m,
            projects: m.projects.map((p) => {
              if (p.name === project.name) {
                return {
                  ...p,
                  tag: targetStage === "active" ? "COMMAND" : "RADAR",
                  tagLabel: targetStage === "active" ? "⚡ Terjaring: Command Center" : "📡 Terjaring: Intel Radar",
                  inDb: true,
                  dbStage: targetStage,
                };
              }
              return p;
            }),
          };
        })
      );
    } catch (err: any) {
      setNotification(`❌ Error: ${err.message}`);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-4rem)] p-2.5 sm:p-6 max-w-6xl mx-auto space-y-3 sm:space-y-4 w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-lg backdrop-blur-md gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white text-lg sm:text-xl shadow-cyan-500/20 shadow-md shrink-0">
            💬
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2">
              Intel AI Chat
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase font-mono">
                Live Scanner
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Riset airdrop Web3 profesional & live web parser
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <button
            onClick={() => setShowVisualGuide(!showVisualGuide)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>👀</span>
            <span>{showVisualGuide ? "Tutup Guide" : "Visual Guide"}</span>
          </button>
          <Link
            href="/assets"
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>🪙</span>
            <span>Vault Koin</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs font-mono shadow-md animate-fadeIn flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Visual Guide Modal / Banner */}
      {showVisualGuide && (
        <div className="bg-slate-900 border border-purple-500/40 p-4 rounded-xl shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <span>🖼️</span> Anatomi Bentukan Website Proyek Web3 (dApp)
            </h2>
            <button onClick={() => setShowVisualGuide(false)} className="text-slate-400 hover:text-white text-xs">
              Tutup ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Bagi yang baru melihat dApp Web3, website proyek testnet itu bukan seperti web biasa. Berikut 3 bentuk umum yang akan Anda temui saat membuka link resmi proyek:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">1. Portal Faucet</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded">Pancuran Koin</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Tampilan simpel berisi kolom input alamat dompet <code>0x...</code> dan tombol <strong>"Drip Token"</strong>. Sekali klik, koin gratis langsung dikirim ke wallet Anda.
              </p>
              <div className="bg-slate-900 border border-slate-700/60 p-2 rounded text-[10px] font-mono text-slate-400">
                [ Connect Wallet ]<br />
                Address: 0xAb58...<br />
                Button: [ DRIP $BERA ]
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">2. DEX Swap (BEX)</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">Tukar Token</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Bursa desentralisasi mirip Uniswap. Ada pilihan <em>Pay</em> dan <em>Receive</em>. Di sinilah token faucet ditukar untuk melipatgandakan interaksi on-chain.
              </p>
              <div className="bg-slate-900 border border-slate-700/60 p-2 rounded text-[10px] font-mono text-slate-400">
                Swap: 1.0 BERA ➔ 150 HONEY<br />
                Slippage: 0.5%<br />
                Button: [ SWAP NOW ]
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">3. Quest & Pet Gamification</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded">Daily XP</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Contohnya <strong>Initia Jennie Pet</strong> & <strong>Story Odyssey</strong>. Ada tombol interaktif harian untuk memberi makan virtual pet atau mint NFT lisensi.
              </p>
              <div className="bg-slate-900 border border-slate-700/60 p-2 rounded text-[10px] font-mono text-slate-400">
                Jennie Pet Level: 14<br />
                Daily Food: [ FEED JENNIE ]<br />
                Reward: +250 XP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Thread */}
      <div className="flex-1 min-h-0 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 shadow-inner">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center space-x-2 mb-1 px-1">
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                {m.role === "user" ? "👤 Operator" : "🤖 Intel Agent (Web Researcher)"}
              </span>
              <span className="text-[10px] text-slate-500">{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[94%] sm:max-w-2xl lg:max-w-3xl rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-xs md:text-sm space-y-2">
                {m.content}
              </div>

              {/* Embedded Project Alpha Cards */}
              {m.projects && m.projects.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>📦 PROYEK TERKAIT & TAG STATUS:</span>
                    <span className="text-[10px] text-slate-500">Cross-reference Supabase</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {m.projects.map((p) => (
                      <div
                        key={p.name}
                        className={`p-3 rounded-xl border transition ${
                          p.tag === "COMMAND"
                            ? "bg-emerald-950/30 border-emerald-500/40"
                            : p.tag === "RADAR"
                            ? "bg-cyan-950/30 border-cyan-500/40"
                            : "bg-slate-950 border-purple-500/30"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">💎</span>
                            <div>
                              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                {p.name}
                                <span className="text-[10px] font-mono text-slate-400">({p.token})</span>
                              </h3>
                              <p className="text-[10px] text-slate-400">{p.type} • {p.network}</p>
                            </div>
                          </div>

                          {/* Tagging Badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                              p.tag === "COMMAND"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : p.tag === "RADAR"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            }`}
                          >
                            {p.tagLabel}
                          </span>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-300 grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-slate-500">Backing:</span> {p.funding}
                          </div>
                          <div>
                            <span className="text-slate-500">Est. Return:</span> {p.return}
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500">Cara Garap:</span> {p.guide}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                          >
                            <span>🌐</span> Buka Website Asli ↗
                          </a>

                          <div className="flex items-center space-x-2">
                            {p.tag === "NEW" && (
                              <>
                                <button
                                  disabled={actionLoading === `${p.name}-scouted`}
                                  onClick={() => handleCapture(p, "scouted")}
                                  className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-medium transition"
                                >
                                  {actionLoading === `${p.name}-scouted` ? "Menyimpan..." : "+ Jaring ke Radar"}
                                </button>
                                <button
                                  disabled={actionLoading === `${p.name}-active`}
                                  onClick={() => handleCapture(p, "active")}
                                  className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-medium transition"
                                >
                                  {actionLoading === `${p.name}-active` ? "Menyimpan..." : "+ Ke Command Center"}
                                </button>
                              </>
                            )}

                            {p.tag === "RADAR" && (
                              <button
                                disabled={actionLoading === `${p.name}-active`}
                                onClick={() => handleCapture(p, "active")}
                                className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-medium transition"
                              >
                                {actionLoading === `${p.name}-active` ? "Memindahkan..." : "⚡ Pindah ke Command"}
                              </button>
                            )}

                            {p.tag === "COMMAND" && (
                              <Link
                                href="/command"
                                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium transition hover:bg-emerald-500/30"
                              >
                                ⚡ Lihat di Command Center
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl w-fit text-xs text-slate-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Agen Intel sedang melakukan riset & scanning web...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">Cepat:</span>
        <button
          onClick={() => handleSend("🌐 Riset website: https://odyssey.storyprotocol.xyz")}
          className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          🔍 Riset URL Story Protocol
        </button>
        <button
          onClick={() => handleSend("Apakah koin testnet ini sudah masuk ke dompetku atau masih di Google?")}
          className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          👛 Koin di Dompet vs Google
        </button>
        <button
          onClick={() => handleSend("Koin apa saja yang faucet-nya siap klaim dan swap hari ini?")}
          className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          🚰 Faucet Siap Klaim
        </button>
        <button
          onClick={() => handleSend("Beri saya daftar garapan airdrop dengan backing modal terbesar!")}
          className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          💎 Airdrop Backing Tertinggi
        </button>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 sm:p-2 rounded-xl shadow-lg shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan peluang airdrop, tempel URL web untuk riset live, atau status koin..."
          className="flex-1 bg-transparent px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-3.5 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 shrink-0"
        >
          <span>Kirim</span>
          <span>➔</span>
        </button>
      </form>
    </div>
  );
}
