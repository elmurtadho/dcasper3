import { NextResponse } from "next/server";

// Fallback configuration
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://udnyimtjrfbetxpgvegw.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbnlpbXRqcmZiZXR4cGd2ZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTU4MDAsImV4cCI6MjEwNDg3MTgwMH0.5GjKin7V7uNU9NoeIcVXhZzoo6yYAfWGM4l0vxS_J2I";

const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1548987113473577000/6QeBeV2tAuHfxb1LhfpH88izIyUrkFJrsWlZWp2oUIT2zeLZkieYr3jH9FYPGOXkBVFB";

const DOLPHIN_PROFILE_ID = process.env.DOLPHIN_PROFILE_ID || "862684906";
const DASHBOARD_BASE_URL = "https://dcasper3.vercel.app";

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// Curated high-conviction airdrop radar pool
const CURATED_RADAR_OPPORTUNITIES = [
  {
    name: "Story Protocol Odyssey Testnet",
    type: "IP Layer-1 Protocol",
    intel_data: {
      tier: "Tier 1 - High Conviction Alpha",
      network: "Story Odyssey Testnet (Chain ID: 1516)",
      budget_requirement: "Free (Faucet Claim)",
      reward_token: "$IP Token",
      estimated_return: "$1,200 - $3,500",
      dashboard_url: "https://odyssey.storyprotocol.xyz",
      tasks: [
        { name: "Register IP Asset via Faucet", status: "ready", interval: "12h" },
        { name: "Mint Royalty License Token", status: "ready" },
        { name: "Execute Dispute Module Interaction", status: "pending" },
      ],
      metrics: {
        backed_funding: "$140M",
        lead_investors: "a16z crypto, Endeavor, Samsung Next",
      },
    },
    command_payload: "--task=claim_ip_faucet --mint_license --story_testnet",
  },
  {
    name: "Movement Network Olympus (MoveVM L2)",
    type: "Modular Move-EVM L2",
    intel_data: {
      tier: "Tier 1 - Ecosystem Testnet",
      network: "Movement Porto Testnet",
      budget_requirement: "Zero Capital (Testnet Faucet)",
      reward_token: "$MOVE",
      estimated_return: "$1,000 - $3,000",
      dashboard_url: "https://testnet.movementnetwork.xyz",
      tasks: [
        { name: "Faucet 10 MOVE tokens", status: "ready" },
        { name: "Swap on Razor DEX (MoveVM)", status: "ready" },
        { name: "Deploy Move smart module", status: "pending" },
      ],
      metrics: {
        backed_funding: "$38M",
        lead_investors: "Polychain Capital, Hack VC, Binance Labs",
      },
    },
    command_payload: "--task=faucet_move --swap_razor --deploy_contract",
  },
  {
    name: "Sonic Labs (Fantom 2.0 Super-Fast L1)",
    type: "10k TPS EVM Layer-1",
    intel_data: {
      tier: "Tier 1 - Mainnet Genesis Airdrop",
      network: "Sonic Testnet",
      budget_requirement: "Gas Only ($0)",
      reward_token: "$S (Sonic Token)",
      estimated_return: "$1,500 - $4,500",
      dashboard_url: "https://soniclabs.com",
      tasks: [
        { name: "Testnet Arcade Game Play", status: "ready" },
        { name: "Sonic Speed Swap on DEX", status: "ready" },
        { name: "Bridge from Sepolia to Sonic", status: "pending" },
      ],
      metrics: {
        backed_funding: "$10M + Andre Cronje Backed",
        tps_speed: "10,000 TPS with 1s finality",
      },
    },
    command_payload: "--task=arcade_play --bridge_sepolia --swap_sonic",
  },
  {
    name: "Initia Public Incentivized Testnet",
    type: "Interwoven Modular Rollup",
    intel_data: {
      tier: "Tier 1 - Gamified Campaign",
      network: "Initia Testnet",
      budget_requirement: "Zero Budget",
      reward_token: "$INIT",
      estimated_return: "$2,000 - $5,000",
      dashboard_url: "https://initia.xyz",
      tasks: [
        { name: "Feed Jennie Pet Daily (XP)", status: "ready", interval: "24h" },
        { name: "Complete Interwoven Swaps", status: "ready" },
        { name: "Stake INIT to Validator", status: "pending" },
      ],
      metrics: {
        backed_funding: "$22.5M",
        lead_investors: "Binance Labs, Delphi Digital, Hack VC",
      },
    },
    command_payload: "--task=feed_jennie --stake_init --daily_xp",
  },
  {
    name: "Fuel Network Ignition Mainnet",
    type: "Rollup OS for Ethereum",
    intel_data: {
      tier: "Tier 1 - Ethereum L2",
      network: "Fuel Ignition Mainnet / Testnet",
      budget_requirement: "Low ($5 - $10) or Free Testnet",
      reward_token: "$FUEL",
      estimated_return: "$1,000 - $3,000",
      dashboard_url: "https://app.fuel.network",
      tasks: [
        { name: "Connect Fuel Wallet & Deposit", status: "ready" },
        { name: "Provide Liquidity on Mira DEX", status: "pending" },
        { name: "Trade on SwaySwap", status: "ready" },
      ],
      metrics: {
        backed_funding: "$81.5M",
        lead_investors: "Blockchain Capital, Stratos Technologies",
      },
    },
    command_payload: "--task=fuel_wallet_check --mira_swap --fuel_ignition",
  },
  {
    name: "MegaETH Devnet Acceleration",
    type: "Real-Time 100k TPS L2",
    intel_data: {
      tier: "Tier 1 - Ultra High Performance",
      network: "MegaETH Public Testnet",
      budget_requirement: "Free Testnet",
      reward_token: "$MEGA Token",
      estimated_return: "$2,500 - $6,000",
      dashboard_url: "https://megaeth.systems",
      tasks: [
        { name: "Claim MegaETH Faucet ETH", status: "ready", interval: "24h" },
        { name: "Interact with Mega Arcade DEX", status: "ready" },
        { name: "Deploy Mega Bytecode Contract", status: "pending" },
      ],
      metrics: {
        backed_funding: "$20M Seed",
        lead_investors: "Dragonfly Capital, Vitalik Buterin, Robot Ventures",
      },
    },
    command_payload: "--task=claim_mega_faucet --deploy_mega --verify_tps",
  },
];

// Helper: send webhook to Discord
async function sendDiscordWebhook(content: string, embeds?: any[]) {
  if (!DISCORD_WEBHOOK_URL) return false;
  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "dcasper3 Intel Agent",
        avatar_url: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico",
        content,
        embeds,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Discord webhook dispatch error:", err);
    return false;
  }
}

// Helper: fetch all existing projects from Supabase
async function getExistingProjects(): Promise<any[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=id,name,lifecycle_stage,status,intel_data,updated_at`,
      {
        headers: SUPABASE_HEADERS,
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to query Supabase projects:", err);
    return [];
  }
}

// Helper: insert newly scouted project
async function insertScoutedProject(projectData: any) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: "POST",
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        name: projectData.name,
        type: projectData.type,
        status: "idle",
        lifecycle_stage: "scouted",
        command_payload: projectData.command_payload || "--task=default",
        intel_data: projectData.intel_data || {},
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to insert scouted project:", err);
    return false;
  }
}

// Core scan & notification routine
async function executeAutonomousRadarScan() {
  const existing = await getExistingProjects();
  const existingNames = new Set(existing.map((p) => p.name.trim().toLowerCase()));

  const newlyDiscovered: any[] = [];

  for (const opp of CURATED_RADAR_OPPORTUNITIES) {
    const norm = opp.name.trim().toLowerCase();
    if (!existingNames.has(norm)) {
      const inserted = await insertScoutedProject(opp);
      if (inserted) {
        newlyDiscovered.push(opp);
      }
    }
  }

  // 1. Radar scan result notification rule
  if (newlyDiscovered.length > 0) {
    const fields = newlyDiscovered.slice(0, 5).map((p) => {
      const intel = p.intel_data || {};
      return {
        name: `💎 ${p.name} (${p.type})`,
        value: `**Tier:** \`${intel.tier || "Alpha"}\`\n**Budget:** \`${intel.budget_requirement || "Free"}\`\n**Est. Return:** \`${intel.estimated_return || "N/A"}\`\n**URL:** [Buka Dashboard](${intel.dashboard_url || DASHBOARD_BASE_URL})\n**Payload:** \`${p.command_payload || "--task=default"}\``,
        inline: false,
      };
    });

    const embed = {
      title: `📡 [INTEL RADAR] Terdeteksi ${newlyDiscovered.length} Garapan Airdrop Baru!`,
      description: `Daftar garapan airdrop baru berikut telah otomatis dimasukkan ke **Intel Radar** dan siap dievaluasi untuk masuk ke antrean eksekusi:\n🔗 [Buka Intel Radar Dashboard](${DASHBOARD_BASE_URL})`,
      color: 0x06b6d4, // Cyan
      fields,
      footer: {
        text: `dcasper3 Autonomous Cloud Radar • Profile ${DOLPHIN_PROFILE_ID}`,
      },
      timestamp: new Date().toISOString(),
    };

    await sendDiscordWebhook(
      `🚨 **RADAR INTEL ALERT:** Terdeteksi **${newlyDiscovered.length}** project garapan airdrop baru yang belum masuk list eksekusi!`,
      [embed]
    );
  } else {
    // EXACT user required rule: "0 new project detected"
    await sendDiscordWebhook("0 new project detected");
  }

  // 2. Execution Reminder notification routine
  const activeProjects = existing.filter((p) => p.lifecycle_stage === "active");
  const dueProjects = activeProjects.filter((p) => {
    const st = p.status || "idle";
    const tasks = p.intel_data?.tasks || [];
    const hasReady = tasks.some((t: any) => t.status === "ready" || t.status === "operational");
    return st === "idle" && (hasReady || tasks.length === 0);
  });

  if (dueProjects.length > 0) {
    const reminderFields = dueProjects.slice(0, 6).map((p) => ({
      name: `⚡ ${p.name}`,
      value: `**Status:** \`${p.status || "idle"}\` | **Profile:** \`${DOLPHIN_PROFILE_ID}\`\n**Payload:** \`${p.command_payload || "--task=default"}\`\n**Aksi:** Buka Command Center untuk eksekusi 1-ketuk.`,
      inline: false,
    }));

    const reminderEmbed = {
      title: `⏰ [EXECUTION REMINDER] ${dueProjects.length} Project Siap Dijalankan!`,
      description: `Terdapat **${dueProjects.length} project** di Command Center yang sudah waktunya dieksekusi.\nTekan tombol **⚡ RUN ALL PROJECTS** di Command Center untuk menjalankan seluruh antrean secara otomatis:\n🔗 [Buka Command Center](${DASHBOARD_BASE_URL}/command)`,
      color: 0x10b981, // Emerald
      fields: reminderFields,
      footer: {
        text: `dcasper3 Reminder Engine • Dolphin Profile ${DOLPHIN_PROFILE_ID}`,
      },
      timestamp: new Date().toISOString(),
    };

    await sendDiscordWebhook(
      `🔔 **REMINDER:** Waktunya mengeksekusi **${dueProjects.length} project** di Command Center!`,
      [reminderEmbed]
    );
  }

  return {
    success: true,
    newDiscoveredCount: newlyDiscovered.length,
    dueProjectsCount: dueProjects.length,
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const result = await executeAutonomousRadarScan();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await executeAutonomousRadarScan();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

