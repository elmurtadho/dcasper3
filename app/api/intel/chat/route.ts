import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://udnyimtjrfbetxpgvegw.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbnlpbXRqcmZiZXR4cGd2ZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTU4MDAsImV4cCI6MjEwNDg3MTgwMH0.5GjKin7V7uNU9NoeIcVXhZzoo6yYAfWGM4l0vxS_J2I";

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// Fetch all registered projects from Supabase
async function getAllProjects(): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*`, {
      headers: SUPABASE_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching projects from Supabase:", err);
    return [];
  }
}

// Extract clean text from HTML
function extractTextFromHtml(html: string): { title: string; description: string; textSnippet: string } {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) title = titleMatch[1].trim();

  let description = "";
  const descMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) description = descMatch[1].trim();

  // Strip script, style, and svg tags
  const clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const textSnippet = clean.slice(0, 2000);
  return { title, description, textSnippet };
}

// Live URL Web Researcher
async function fetchAndAnalyzeWeb(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 dcasper3-researcher/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        url,
        success: false,
        error: `HTTP status ${res.status}: ${res.statusText}`,
      };
    }

    const html = await res.text();
    const { title, description, textSnippet } = extractTextFromHtml(html);

    // Heuristics for Web3 alpha extraction
    const hasFaucet = /faucet|claim|drip|testnet\s+tokens/i.test(textSnippet);
    const hasSwap = /swap|dex|liquidity|trade|amm/i.test(textSnippet);
    const hasBridge = /bridge|deposit|withdraw/i.test(textSnippet);
    const hasAirdrop = /airdrop|points|reward|incentivized|quest|campaign/i.test(textSnippet);

    return {
      url,
      success: true,
      title: title || url,
      description: description || "Portal Web3 dApp",
      snippet: textSnippet,
      features: {
        hasFaucet,
        hasSwap,
        hasBridge,
        hasAirdrop,
      },
    };
  } catch (err: any) {
    return {
      url,
      success: false,
      error: err?.message || "Gagal membuka halaman web",
    };
  }
}

// Helper to match project status in DB
function getProjectTag(name: string, allProjects: any[]) {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const p of allProjects) {
    const pNorm = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm.includes(pNorm) || pNorm.includes(norm)) {
      if (p.lifecycle_stage === "active") {
        return { tag: "COMMAND", label: "⚡ Terjaring: Command Center", project: p };
      }
      if (p.lifecycle_stage === "scouted") {
        return { tag: "RADAR", label: "📡 Terjaring: Intel Radar", project: p };
      }
      if (p.lifecycle_stage === "ignored") {
        return { tag: "IGNORED", label: "🗑️ Diabaikan", project: p };
      }
    }
  }
  return { tag: "NEW", label: "🆕 Belum Terjaring (Alpha Baru)", project: null };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. ACTION: Capture project into Supabase from chat button
    if (body.action === "capture_project") {
      const { projectData, targetStage = "scouted" } = body;
      if (!projectData || !projectData.name) {
        return NextResponse.json({ error: "Missing project data" }, { status: 400 });
      }

      const insertPayload = {
        name: projectData.name,
        type: projectData.type || "Web3 Protocol",
        status: "idle",
        lifecycle_stage: targetStage,
        command_payload: projectData.command_payload || `--task=claim_faucet --daily`,
        intel_data: {
          tier: projectData.tier || "Tier 1 - High Alpha",
          network: projectData.network || "EVM / Testnet",
          budget_requirement: projectData.budget_requirement || "Zero Capital (Free)",
          reward_token: projectData.reward_token || "$ALPHA",
          estimated_return: projectData.estimated_return || "$1,000 - $3,500",
          dashboard_url: projectData.url || projectData.dashboard_url || "https://dcasper3.vercel.app",
          tasks: projectData.tasks || [
            { name: "Klaim Faucet Harian", status: "ready", interval: "24h" },
            { name: "Eksekusi Swap / Interaction", status: "ready" },
          ],
        },
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: "POST",
        headers: SUPABASE_HEADERS,
        body: JSON.stringify(insertPayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Supabase insert failed: ${errText}` }, { status: 500 });
      }

      const saved = await res.json();
      return NextResponse.json({
        success: true,
        message: `Proyek ${projectData.name} berhasil dijaring ke ${targetStage === "active" ? "Command Center" : "Intel Radar"}!`,
        project: saved[0] || insertPayload,
      });
    }

    // 2. CHAT & RESEARCH QUERY
    const { message = "" } = body;
    const cleanMsg = message.trim();

    if (!cleanMsg) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch existing projects for real-time tagging
    const allProjects = await getAllProjects();

    // Check if the user pasted a URL
    const urlMatch = cleanMsg.match(/https?:\/\/[^\s]+/i);
    let webAnalysis: any = null;

    if (urlMatch) {
      const targetUrl = urlMatch[0];
      webAnalysis = await fetchAndAnalyzeWeb(targetUrl);
    }

    // Structured Web3 Intelligence Knowledge Base
    const KNOWLEDGE_BASE = [
      {
        name: "Story Protocol Odyssey Testnet",
        type: "IP Layer-1 Protocol",
        token: "$IP",
        url: "https://odyssey.storyprotocol.xyz",
        network: "Story Odyssey Testnet (Chain ID: 1516)",
        funding: "$140M (a16z crypto, Endeavor)",
        guide: "Masuk ke portal Odyssey, connect wallet, klaim testnet IP di faucet, mint IP Asset NFT & license token.",
        tier: "Tier 1 - Ultra High Conviction",
        budget: "Free Testnet",
        return: "$1,500 - $3,500",
      },
      {
        name: "Berachain Bartio Testnet",
        type: "Proof-of-Liquidity Layer-1",
        token: "$BERA & $HONEY",
        url: "https://bartio.faucet.berachain.com",
        network: "Berachain Bartio (Chain ID: 80084)",
        funding: "$142M (Polychain, Brevan Howard)",
        guide: "Klaim testnet BERA tiap 8 jam di faucet, tukar BERA ke HONEY di BEX DEX, deposit liquidity di Bend/Berps.",
        tier: "Tier 1 - Ecosystem Alpha",
        budget: "Free Faucet",
        return: "$2,000 - $6,000",
      },
      {
        name: "Movement Network Olympus",
        type: "MoveVM Modular Layer-2",
        token: "$MOVE",
        url: "https://testnet.movementnetwork.xyz",
        network: "Movement Porto Testnet",
        funding: "$38M (Polychain, Binance Labs)",
        guide: "Faucet 10 MOVE tokens, swap token di Razor DEX, deploy smart contract Move sederhana.",
        tier: "Tier 1 - High Conviction",
        budget: "Zero Capital",
        return: "$1,000 - $3,000",
      },
      {
        name: "Sonic Labs",
        type: "Super-Fast EVM Layer-1",
        token: "$S (Sonic Token)",
        url: "https://soniclabs.com",
        network: "Sonic Testnet (10,000 TPS)",
        funding: "$10M + Andre Cronje",
        guide: "Mainkan game arcade di testnet Sonic untuk mencatat tx speed tinggi, lakukan swap instan di DEX Sonic.",
        tier: "Tier 1 - Genesis Airdrop",
        budget: "Gas Only ($0)",
        return: "$1,500 - $4,500",
      },
      {
        name: "Initia Interwoven Rollup",
        type: "Gamified Modular Rollup",
        token: "$INIT",
        url: "https://initia.xyz",
        network: "Initia Public Testnet",
        funding: "$22.5M (Binance Labs, Delphi Digital)",
        guide: "Klaim faucet INIT, beri makan peliharaan virtual Jennie setiap 24 jam untuk panen XP poin airdrop, lakukan interwoven swap.",
        tier: "Tier 1 - Gamified Campaign",
        budget: "Zero Budget",
        return: "$2,000 - $5,000",
      },
      {
        name: "MegaETH Devnet",
        type: "Real-time 100k TPS L2",
        token: "$MEGA",
        url: "https://megaeth.systems",
        network: "MegaETH Devnet",
        funding: "$20M (Dragonfly, Vitalik Buterin)",
        guide: "Uji performa transaksi real-time di devnet MegaETH dan klaim peran genesis komunitas.",
        tier: "Tier 1 - Ultra High Alpha",
        budget: "Zero Capital",
        return: "$2,000 - $7,000",
      },
    ];

    // Identify mentioned or relevant projects
    const matchedProjects: any[] = [];
    for (const kb of KNOWLEDGE_BASE) {
      const tagInfo = getProjectTag(kb.name, allProjects);
      const isMentioned =
        cleanMsg.toLowerCase().includes(kb.name.toLowerCase().split(" ")[0]) ||
        cleanMsg.toLowerCase().includes(kb.token.toLowerCase().replace("$", "")) ||
        (webAnalysis && webAnalysis.snippet && webAnalysis.snippet.toLowerCase().includes(kb.name.toLowerCase().split(" ")[0]));

      matchedProjects.push({
        ...kb,
        tag: tagInfo.tag,
        tagLabel: tagInfo.label,
        inDb: !!tagInfo.project,
        dbStage: tagInfo.project?.lifecycle_stage || null,
        isHighlighted: isMentioned,
      });
    }

    // Compose Agent Response
    let responseText = "";
    const lower = cleanMsg.toLowerCase();

    // SCENARIO 1: Live Webpage Analysis
    if (webAnalysis) {
      if (webAnalysis.success) {
        // Tag check for the scanned site
        const webName = webAnalysis.title.split(/[-–|]/)[0].trim() || "Web3 Project";
        const tagInfo = getProjectTag(webName, allProjects);

        responseText = `### 🌐 Hasil Riset Live Webpage: [${webAnalysis.title}](${webAnalysis.url})\n\n` +
          `Agen Intel telah membuka dan menganalisis struktur situs web secara langsung:\n\n` +
          `* **Status di dCasper3:** \`${tagInfo.label}\`\n` +
          `* **Deskripsi:** ${webAnalysis.description}\n` +
          `* **Fitur Terdeteksi:**\n` +
          `  - 🚰 Faucet Portal: ${webAnalysis.features.hasFaucet ? "✅ **TERSEDIA** (Siap diklaim)" : "❌ Belum terdeteksi"}\n` +
          `  - 🔄 DEX Swap / Liquidity: ${webAnalysis.features.hasSwap ? "✅ **LIVE** (Siap swap)" : "❌ Tidak ada"}\n` +
          `  - 🌉 Bridge Protocol: ${webAnalysis.features.hasBridge ? "✅ **AKTIF**" : "❌ Tidak ada"}\n` +
          `  - 🎁 Program Airdrop / Points: ${webAnalysis.features.hasAirdrop ? "✅ **TERVERIFIKASI**" : "❌ Tidak tertera"}\n\n` +
          `**Kutipan Alpha dari Halaman:**\n> "${webAnalysis.snippet.slice(0, 320)}..."\n\n` +
          (tagInfo.tag === "NEW"
            ? `💡 *Proyek ini belum terdaftar di dasbor dCasper3 Anda. Anda dapat langsung menjaringnya dengan mengklik tombol di kartu bawah!*`
            : `💡 *Proyek ini sudah ada di sistem dCasper3 Anda dengan status ${tagInfo.label}.*`);
      } else {
        responseText = `⚠️ **Gagal Mengakses URL:** ${webAnalysis.error}\nPastikan URL valid dan server tujuan tidak memblokir akses publik.`;
      }
    }
    // SCENARIO 2: Inquiries about wallet vs google / assets
    else if (lower.includes("dompet") || lower.includes("wallet") || lower.includes("google") || lower.includes("masuk")) {
      responseText = `### 🪙 Edukasi Asset: Dompet Crypto vs Google vs dCasper3\n\n` +
        `1. **Apakah koin testnet sudah masuk ke dompet Anda?**\n` +
        `   - **BELUM**, kecuali jika Anda atau script \`worker_bot.py\` sudah mengeksekusi tombol "Claim Faucet" di situs resminya.\n` +
        `2. **Apakah koin tersimpan di Google?**\n` +
        `   - **Bukan.** Google hanyalah mesin pencari web. Koin Web3 dan token airdrop hanya ada di **Jaringan Blockchain Testnet** masing-masing dan terikat pada alamat dompet 0x... Anda di MetaMask/Rabby Dolphin Anty.\n` +
        `3. **Lalu apa peran dCasper3?**\n` +
        `   - dCasper3 adalah **Pusat Komando & Intelijen** Anda. Web ini melacak proyek terbaik, mengunci link resmi dApp, memantau cooldown reset klaim, dan menginstruksikan bot kapan harus mengeksekusi.\n\n` +
        `Gunakan menu **🪙 Koin & Faucets** (/assets) untuk melihat link klaim langsung ke faucet masing-masing jaringan!`;
    }
    // SCENARIO 3: Inquiries about claimable assets or faucets
    else if (lower.includes("faucet") || lower.includes("klaim") || lower.includes("claim") || lower.includes("koin")) {
      const activeCount = allProjects.filter((p) => p.lifecycle_stage === "active").length;
      responseText = `### 🚰 Status Faucet & Peluang Klaim Aset Aktif\n\n` +
        `Saat ini terdapat **${activeCount} proyek aktif di Command Center** dan **${allProjects.length} total proyek terpantau** di dCasper3:\n\n` +
        `* 🐻 **Berachain ($BERA)**: Faucet testnet reset setiap 8 jam di portal Bartio. Siap di-swap ke $HONEY di BEX DEX.\n` +
        `* 📜 **Story Protocol ($IP)**: Faucet testnet Odyssey + Minting NFT Hak Cipta (IP License).\n` +
        `* ⚡ **Movement Network ($MOVE)**: Faucet 10 $MOVE gratis di Porto testnet + Swap di Razor DEX.\n` +
        `* 🐱 **Initia ($INIT)**: Jennie Pet Feeding reset setiap 24 jam untuk panen XP harian.\n\n` +
        `> 💡 **Fitur Notifikasi Discord:** Bot webhook dCasper3 sekarang otomatis memantau jam reset cooldown di atas dan langsung mengirim alert merah berbunyi **"Waktunya Klaim!"** ke Discord Anda tepat saat cooldown selesai!`;
    }
    // SCENARIO 4: General intelligence and recommendations
    else {
      responseText = `### 📡 Laporan Intelijen Web3 Professional | dCasper3\n\n` +
        `Halo Operator! Saya adalah **Agen Intel dCasper3**, asisten riset Web3 profesional Anda yang bertugas memindai airdrop, memverifikasi pendanaan, serta memantau status eksekusi.\n\n` +
        `**Status Proyek yang Sedang Dipantau Saat Ini:**\n` +
        matchedProjects
          .slice(0, 5)
          .map(
            (p) =>
              `* **${p.name}** (${p.token})\n` +
              `  - Status: \`${p.tagLabel}\`\n` +
              `  - Backing: ${p.funding} | Return Est: ${p.return}\n` +
              `  - Misi: ${p.guide}`
          )
          .join("\n") +
        `\n\n💡 *Anda dapat menanyakan proyek spesifik, menempelkan link URL website apa pun untuk dianalisis live, atau klik tombol di bawah untuk menjaring airdrop baru ke Command Center!*`;
    }

    return NextResponse.json({
      reply: responseText,
      webAnalysis,
      projects: matchedProjects,
      totalTracked: allProjects.length,
    });
  } catch (err: any) {
    console.error("Intel Chat API Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
