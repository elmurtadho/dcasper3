#!/usr/bin/env python3
"""
========================================================================================
dcasper3 - Discord Intelligence and Execution Reminder Agent
========================================================================================
Features:
1. Discord Webhook integration: Sends automated chats and rich embeds to Discord channel.
2. Intel Radar Scanner:
   - Scans and discovers Web3 airdrop opportunities.
   - Inserts newly scouted projects into Supabase 'projects' (lifecycle_stage = 'scouted').
   - If new projects detected: Posts detailed alpha list to Discord.
   - If NO new projects detected: Sends exact message "0 new project detected".
3. Execution Reminder Agent:
   - Evaluates active Command Center projects.
   - Triggers timely Discord reminders when projects are ready for routine / daily runs.
========================================================================================
"""

import os
import sys
import time
import json
import re
import datetime
import argparse
from typing import Optional, Dict, Any, List
import requests
from pathlib import Path

# Reconfigure stdout/stderr for Unicode support on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ==============================================================================
# ENVIRONMENT AND CREDENTIAL RESOLUTION
# ==============================================================================
def load_env_local():
    """Load variables from .env.local if present without external dependencies."""
    env_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env.local"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
    ]
    for p in env_paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k not in os.environ:
                            os.environ[k] = v

load_env_local()

SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL") or "https://udnyimtjrfbetxpgvegw.supabase.co"
SUPABASE_ANON_KEY: str = (
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
        "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbnlpbXRqcmZiZXR4cGd2ZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTU4MDAsImV4cCI6MjEwNDg3MTgwMH0."
        "5GjKin7V7uNU9NoeIcVXhZzoo6yYAfWGM4l0vxS_J2I"
    )
)
DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "").strip()
DOLPHIN_PROFILE_ID: str = os.getenv("DOLPHIN_PROFILE_ID", "862684906")
DASHBOARD_BASE_URL: str = "https://dcasper3.vercel.app"

SUPABASE_HEADERS: Dict[str, str] = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# ==============================================================================
# LOGGING UTILITIES
# ==============================================================================
class Log:
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    RESET = "\033[0m"

    @classmethod
    def _t(cls) -> str:
        return datetime.datetime.now().strftime("%H:%M:%S")

    @classmethod
    def info(cls, msg: str):
        print(f"[{cls._t()}] {cls.CYAN}[DISCORD-AGENT]{cls.RESET} {msg}", flush=True)

    @classmethod
    def success(cls, msg: str):
        print(f"[{cls._t()}] {cls.GREEN}[SUCCESS]{cls.RESET} {msg}", flush=True)

    @classmethod
    def warn(cls, msg: str):
        print(f"[{cls._t()}] {cls.YELLOW}[WARN]{cls.RESET} {msg}", flush=True)

    @classmethod
    def error(cls, msg: str):
        print(f"[{cls._t()}] {cls.RED}[ERROR]{cls.RESET} {msg}", flush=True)


# ==============================================================================
# DISCORD WEBHOOK CLIENT
# ==============================================================================
def send_discord_chat(content: str, embeds: Optional[List[Dict[str, Any]]] = None) -> bool:
    """Send text message or embed payload to Discord server via Webhook."""
    global DISCORD_WEBHOOK_URL
    webhook_url = DISCORD_WEBHOOK_URL or os.getenv("DISCORD_WEBHOOK_URL", "").strip()

    if not webhook_url:
        Log.warn("DISCORD_WEBHOOK_URL belum dikonfigurasi di .env.local atau environment variable.")
        Log.warn("Pesan yang akan dikirim ke Discord:")
        print(f"--- [DISCORD PREVIEW] ---\n{content}\n-------------------------")
        if embeds:
            print(f"[EMBEDS]: {json.dumps(embeds, indent=2)}")
        return False

    payload: Dict[str, Any] = {
        "username": "dcasper3 Intel Agent",
        "avatar_url": "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/favicon.ico",
    }
    if content:
        payload["content"] = content
    if embeds:
        payload["embeds"] = embeds

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        if resp.status_code in (200, 204):
            Log.success("Pesan berhasil dikirim ke Discord Server!")
            return True
        else:
            Log.error(f"Gagal mengirim ke Discord (Status {resp.status_code}): {resp.text}")
            return False
    except Exception as e:
        Log.error(f"Discord connection error: {e}")
        return False


# ==============================================================================
# CURATED OPPORTUNITY RADAR STREAM
# ==============================================================================
CURATED_RADAR_OPPORTUNITIES = [
    {
        "name": "Story Protocol Odyssey Testnet",
        "type": "IP Layer-1 Protocol",
        "intel_data": {
            "tier": "Tier 1 - High Conviction Alpha",
            "network": "Story Odyssey Testnet (Chain ID: 1516)",
            "budget_requirement": "Free (Faucet Claim)",
            "reward_token": "$IP Token",
            "estimated_return": "$1,200 - $3,500",
            "dashboard_url": "https://odyssey.storyprotocol.xyz",
            "tasks": [
                {"name": "Register IP Asset via Faucet", "status": "ready", "interval": "12h"},
                {"name": "Mint Royalty License Token", "status": "ready"},
                {"name": "Execute Dispute Module Interaction", "status": "pending"}
            ],
            "metrics": {
                "backed_funding": "$140M",
                "lead_investors": "a16z crypto, Endeavor, Samsung Next"
            }
        },
        "command_payload": "--task=claim_ip_faucet --mint_license --story_testnet"
    },
    {
        "name": "Movement Network Olympus (MoveVM L2)",
        "type": "Modular Move-EVM L2",
        "intel_data": {
            "tier": "Tier 1 - Ecosystem Testnet",
            "network": "Movement Porto Testnet",
            "budget_requirement": "Zero Capital (Testnet Faucet)",
            "reward_token": "$MOVE",
            "estimated_return": "$1,000 - $3,000",
            "dashboard_url": "https://testnet.movementnetwork.xyz",
            "tasks": [
                {"name": "Faucet 10 MOVE tokens", "status": "ready"},
                {"name": "Swap on Razor DEX (MoveVM)", "status": "ready"},
                {"name": "Deploy Move smart module", "status": "pending"}
            ],
            "metrics": {
                "backed_funding": "$38M",
                "lead_investors": "Polychain Capital, Hack VC, Binance Labs"
            }
        },
        "command_payload": "--task=faucet_move --swap_razor --deploy_contract"
    },
    {
        "name": "Sonic Labs (Fantom 2.0 Super-Fast L1)",
        "type": "10k TPS EVM Layer-1",
        "intel_data": {
            "tier": "Tier 1 - Mainnet Genesis Airdrop",
            "network": "Sonic Testnet",
            "budget_requirement": "Gas Only ($0)",
            "reward_token": "$S (Sonic Token)",
            "estimated_return": "$1,500 - $4,500",
            "dashboard_url": "https://soniclabs.com",
            "tasks": [
                {"name": "Testnet Arcade Game Play", "status": "ready"},
                {"name": "Sonic Speed Swap on DEX", "status": "ready"},
                {"name": "Bridge from Sepolia to Sonic", "status": "pending"}
            ],
            "metrics": {
                "backed_funding": "$10M + Andre Cronje Backed",
                "tps_speed": "10,000 TPS with 1s finality"
            }
        },
        "command_payload": "--task=arcade_play --bridge_sepolia --swap_sonic"
    },
    {
        "name": "Initia Public Incentivized Testnet",
        "type": "Interwoven Modular Rollup",
        "intel_data": {
            "tier": "Tier 1 - Gamified Campaign",
            "network": "Initia Testnet",
            "budget_requirement": "Zero Budget",
            "reward_token": "$INIT",
            "estimated_return": "$2,000 - $5,000",
            "dashboard_url": "https://initia.xyz",
            "tasks": [
                {"name": "Feed Jennie Pet Daily (XP)", "status": "ready", "interval": "24h"},
                {"name": "Complete Interwoven Swaps", "status": "ready"},
                {"name": "Stake INIT to Validator", "status": "pending"}
            ],
            "metrics": {
                "backed_funding": "$22.5M",
                "lead_investors": "Binance Labs, Delphi Digital, Hack VC"
            }
        },
        "command_payload": "--task=feed_jennie --stake_init --daily_xp"
    },
    {
        "name": "Fuel Network Ignition Mainnet",
        "type": "Rollup OS for Ethereum",
        "intel_data": {
            "tier": "Tier 1 - Ethereum L2",
            "network": "Fuel Ignition Mainnet / Testnet",
            "budget_requirement": "Low ($5 - $10) or Free Testnet",
            "reward_token": "$FUEL",
            "estimated_return": "$1,000 - $3,000",
            "dashboard_url": "https://app.fuel.network",
            "tasks": [
                {"name": "Connect Fuel Wallet & Deposit", "status": "ready"},
                {"name": "Provide Liquidity on Mira DEX", "status": "pending"},
                {"name": "Trade on SwaySwap", "status": "ready"}
            ],
            "metrics": {
                "backed_funding": "$81.5M",
                "lead_investors": "Blockchain Capital, Stratos Technologies"
            }
        },
        "command_payload": "--task=fuel_wallet_check --mira_swap --fuel_ignition"
    }
]


# ==============================================================================
# DATABASE HELPERS
# ==============================================================================
def get_existing_projects() -> List[Dict[str, Any]]:
    """Fetch all projects from Supabase to check existing names and stages."""
    url = f"{SUPABASE_URL}/rest/v1/projects?select=id,name,lifecycle_stage,status,intel_data,updated_at"
    try:
        resp = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            Log.error(f"Failed to fetch projects: {resp.status_code} {resp.text}")
            return []
    except Exception as e:
        Log.error(f"Database connection error: {e}")
        return []


def insert_scouted_project(project_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Insert a newly scouted airdrop project into Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/projects"
    payload = {
        "name": project_data["name"],
        "type": project_data["type"],
        "status": "idle",
        "lifecycle_stage": "scouted",
        "command_payload": project_data.get("command_payload", "--task=default"),
        "intel_data": project_data.get("intel_data", {}),
    }
    try:
        resp = requests.post(url, headers=SUPABASE_HEADERS, json=payload, timeout=10)
        if resp.status_code in (200, 201):
            records = resp.json()
            inserted = records[0] if records else payload
            Log.success(f"Disimpan ke Supabase Radar: {project_data['name']}")
            return inserted
        else:
            Log.error(f"Failed to insert project: {resp.status_code} {resp.text}")
            return None
    except Exception as e:
        Log.error(f"Insert project error: {e}")
        return None


# ==============================================================================
# TIMEZONE & TIME FORMATTING (WIB / UTC+7)
# ==============================================================================
WIB = datetime.timezone(datetime.timedelta(hours=7))

def get_current_wib_time() -> str:
    """Get current time formatted in WIB."""
    return datetime.datetime.now(WIB).strftime("%H:%M WIB")

def format_wib_time(iso_str: Optional[str]) -> str:
    """Convert ISO timestamp to WIB string 'HH:mm WIB'."""
    if not iso_str:
        return get_current_wib_time()
    try:
        dt = datetime.datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        dt_wib = dt.astimezone(WIB)
        return dt_wib.strftime("%H:%M WIB")
    except Exception:
        return get_current_wib_time()

# ==============================================================================
# RADAR SCAN LOGIC
# ==============================================================================
def scan_airdrop_opportunities() -> None:
    """
    1. Scans data airdrop opportunities.
    2. Identifies projects that have NOT yet entered execution (lifecycle_stage = 'active').
    3. If new projects detected:
       - Inserts them into Intel Radar (lifecycle_stage = 'scouted').
       - Posts Discord embed with list of new airdrops and exact discovery time.
    4. If NO new projects detected:
       - Sends EXACT message: "0 new project detected".
    """
    Log.info("Radar scanning for high-alpha Web3 airdrop opportunities...")
    existing = get_existing_projects()
    existing_names = {p["name"].strip().lower() for p in existing}

    newly_discovered: List[Dict[str, Any]] = []

    for opp in CURATED_RADAR_OPPORTUNITIES:
        norm_name = opp["name"].strip().lower()
        if norm_name not in existing_names:
            # New opportunity not yet registered anywhere
            inserted = insert_scouted_project(opp)
            if inserted:
                inserted["discovered_time_wib"] = get_current_wib_time()
                newly_discovered.append(inserted)

    # Evaluate logic rule
    if len(newly_discovered) > 0:
        Log.success(f"Ditemukan {len(newly_discovered)} airdrop baru!")

        # Build Discord Embed
        embed_fields = []
        for p in newly_discovered[:5]:
            intel = p.get("intel_data", {})
            disc_time = p.get("discovered_time_wib") or format_wib_time(p.get("created_at"))
            val = (
                f"⏰ **Waktu Ditemukan:** `{disc_time}`\n"
                f"**Tier:** `{intel.get('tier', 'Alpha')}`\n"
                f"**Budget:** `{intel.get('budget_requirement', 'Free')}`\n"
                f"**Est. Return:** `{intel.get('estimated_return', 'N/A')}`\n"
                f"**URL:** [Buka Dashboard]({intel.get('dashboard_url', DASHBOARD_BASE_URL)})\n"
                f"**Payload:** `{p.get('command_payload', '--task=default')}`"
            )
            embed_fields.append({
                "name": f"💎 {p['name']} ({p['type']})",
                "value": val,
                "inline": False,
            })

        embed = {
            "title": f"📡 [INTEL RADAR] Terdeteksi {len(newly_discovered)} Garapan Airdrop Baru!",
            "description": (
                f"Daftar garapan airdrop baru berikut telah otomatis dimasukkan ke **Intel Radar** "
                f"dan siap dievaluasi untuk masuk ke antrean eksekusi:\n"
                f"[Buka Intel Radar Dashboard]({DASHBOARD_BASE_URL})"
            ),
            "color": 0x06B6D4,  # Cyan
            "fields": embed_fields,
            "footer": {
                "text": f"dcasper3 Radar Engine • Pukul {get_current_wib_time()}"
            },
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        content_msg = f"🚨 **RADAR INTEL ALERT:** Terdeteksi **{len(newly_discovered)}** project garapan airdrop baru yang belum masuk list eksekusi!"
        send_discord_chat(content=content_msg, embeds=[embed])

    else:
        # EXACT required rule: "0 new project detected"
        Log.info("Radar scan completed: 0 new project detected.")
        send_discord_chat(content="0 new project detected")


# ==============================================================================
# HOURLY RECAP LOGIC (MENIT 00)
# ==============================================================================
def execute_hourly_recap() -> None:
    """
    Eksekusi rekapan per jam tepat pada menit 00.
    Merangkum project yang ditemukan dalam 1 jam terakhir beserta jam ditemukannya.
    Jika tidak ada: tetap mengirim '0 new project detected' dan rekapan status radar bersih.
    """
    now_wib = datetime.datetime.now(WIB)
    hour_label = now_wib.strftime("%H:00 WIB")
    Log.info(f"📊 Menjalankan Rekapan Per Jam untuk pukul {hour_label}...")

    # First, run opportunity scan in case any new item appeared
    existing_before = get_existing_projects()
    existing_names = {p["name"].strip().lower() for p in existing_before}

    for opp in CURATED_RADAR_OPPORTUNITIES:
        norm_name = opp["name"].strip().lower()
        if norm_name not in existing_names:
            insert_scouted_project(opp)

    # Re-fetch all projects to inspect timestamps in the last 65 minutes
    projects = get_existing_projects()
    one_hour_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=65)

    recent_scouted = []
    for p in projects:
        if p.get("lifecycle_stage") == "scouted" and p.get("created_at"):
            try:
                dt = datetime.datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))
                if dt >= one_hour_ago:
                    recent_scouted.append(p)
            except Exception:
                pass

    active_projects = [p for p in projects if p.get("lifecycle_stage") == "active"]

    if len(recent_scouted) > 0:
        Log.success(f"Rekapan per jam: Ditemukan {len(recent_scouted)} project dalam 1 jam terakhir.")
        fields = []
        for p in recent_scouted[:6]:
            intel = p.get("intel_data") or {}
            disc_time = format_wib_time(p.get("created_at"))
            fields.append({
                "name": f"💎 {p['name']}",
                "value": (
                    f"⏰ **Ditemukan pada pukul:** `{disc_time}`\n"
                    f"**Tipe:** `{p.get('type', 'EVM / Web3')}` | **Tier:** `{intel.get('tier', 'Alpha')}`\n"
                    f"**Reward:** `{intel.get('reward_token', 'Token')} ({intel.get('estimated_return', 'N/A')})`\n"
                    f"**Syarat:** `{intel.get('budget_requirement', 'Free')}`"
                ),
                "inline": False,
            })

        embed = {
            "title": f"📊 [REKAPAN PER JAM] - Radar Alpha Pukul {hour_label}",
            "description": (
                f"Berikut adalah rekapan garapan airdrop baru yang berhasil dideteksi radar dalam 1 jam terakhir:\n"
                f"🔗 [Buka Intel Radar Dashboard]({DASHBOARD_BASE_URL})"
            ),
            "color": 0x3B82F6,  # Blue
            "fields": fields,
            "footer": {
                "text": f"dcasper3 Hourly Recap • {hour_label}"
            },
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        send_discord_chat(
            content=f"📊 **REKAPAN PER JAM ({hour_label}):** Terdeteksi **{len(recent_scouted)} garapan baru** dalam 1 jam terakhir!",
            embeds=[embed]
        )
    else:
        # EXACT required concept: "0 new project detected"
        Log.info(f"Rekapan per jam: 0 new project detected dalam 1 jam terakhir ({hour_label}).")
        
        embed = {
            "title": f"📊 [REKAPAN PER JAM] - Radar Alpha Pukul {hour_label}",
            "description": (
                f"**0 new project detected** dalam 1 jam terakhir.\n"
                f"Semua sinyal radar bersih dan seluruh peluang airdrop telah dievaluasi.\n\n"
                f"⚡ **Status Command Center:** Terdapat `{len(active_projects)} project` dalam antrean eksekusi.\n"
                f"🔗 [Buka Dasbor dcasper3]({DASHBOARD_BASE_URL})"
            ),
            "color": 0x10B981,  # Emerald
            "footer": {
                "text": f"dcasper3 Hourly Recap • {hour_label}"
            },
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        send_discord_chat(
            content="0 new project detected",
            embeds=[embed]
        )


# ==============================================================================
# EXECUTION REMINDER LOGIC
# ==============================================================================
def check_execution_reminders() -> None:
    """
    Detect active projects in Command Center whose tasks or routine executions
    are due, and send a Discord reminder.
    """
    Log.info("Checking active projects for pending execution reminders...")
    existing = get_existing_projects()
    active_projects = [p for p in existing if p.get("lifecycle_stage") == "active"]

    if not active_projects:
        Log.info("Belum ada project aktif di Command Center untuk dicek reminder-nya.")
        return

    due_projects = []
    for p in active_projects:
        # Project is ready to run if status is 'idle'
        st = p.get("status", "idle")
        intel = p.get("intel_data") or {}
        tasks = intel.get("tasks") or []
        
        has_ready_tasks = any(t.get("status") in ("ready", "operational") for t in tasks)
        if st == "idle" and (has_ready_tasks or len(tasks) == 0):
            due_projects.append(p)

    if due_projects:
        Log.info(f"Ditemukan {len(due_projects)} project aktif yang waktunya dieksekusi.")
        
        fields = []
        for p in due_projects[:6]:
            fields.append({
                "name": f"⚡ {p['name']}",
                "value": (
                    f"**Status:** `{p.get('status', 'idle')}` | **Profile:** `{DOLPHIN_PROFILE_ID}`\n"
                    f"**Payload:** `{p.get('command_payload', '--task=default')}`\n"
                    f"**Aksi:** Buka Command Center untuk eksekusi 1-ketuk."
                ),
                "inline": False,
            })

        embed = {
            "title": f"⏰ [EXECUTION REMINDER] {len(due_projects)} Project Siap Dijalankan!",
            "description": (
                f"Terdapat **{len(due_projects)} project** di Command Center yang sudah waktunya dieksekusi.\n"
                f"Tekan tombol **⚡ RUN ALL PROJECTS** di Command Center untuk menjalankan seluruh antrean secara otomatis:\n"
                f"🔗 [Buka Command Center]({DASHBOARD_BASE_URL}/command)"
            ),
            "color": 0x10B981,  # Emerald
            "fields": fields,
            "footer": {
                "text": f"dcasper3 Reminder Engine • Dolphin Profile {DOLPHIN_PROFILE_ID}"
            },
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        send_discord_chat(
            content=f"🔔 **REMINDER:** Waktunya mengeksekusi **{len(due_projects)} project** di Command Center!",
            embeds=[embed]
        )
    else:
        Log.info("Semua project aktif sedang berjalan atau telah diselesaikan.")


# ==============================================================================
# ==============================================================================
# URGENT ASSET & FAUCET CLAIM / SWAP REMINDER LOGIC (BY INFO DATA & COOLDOWN)
# ==============================================================================
CLAIM_CACHE_FILE = Path(__file__).parent / "claim_cooldown_cache.json"

def parse_interval_hours(interval_str: str) -> float:
    """Parse interval string like '12h', '24h', 'daily', '1h' to hours."""
    s = str(interval_str).strip().lower()
    if not s or s in ("siap klaim", "ready", "none"):
        return 24.0
    if "daily" in s or "24h" in s or "24 jam" in s:
        return 24.0
    if "12h" in s or "12 jam" in s:
        return 12.0
    if "6h" in s:
        return 6.0
    if "1h" in s:
        return 1.0
    if "weekly" in s or "7d" in s:
        return 168.0
    # Try regex/number extraction
    match = re.search(r"(\d+)\s*h", s)
    if match:
        return float(match.group(1))
    return 24.0

def load_claim_cache() -> dict:
    if CLAIM_CACHE_FILE.exists():
        try:
            with open(CLAIM_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_claim_cache(cache: dict) -> None:
    try:
        with open(CLAIM_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        Log.warn(f"Failed to save claim cache: {e}")

def check_urgent_asset_claims(force: bool = False) -> int:
    """
    Pemeriksaan Otomatis Berdasarkan Data Info:
    Mendeteksi koin, faucet, NFT, dan reward yang SUDAH WAKTUNYA diklaim atau di-swap
    berdasarkan interval cooldown masing-masing (12h, 24h/daily, dll).
    Mengirimkan alert ke Discord dan mengupdate histori agar tidak spam.
    """
    Log.info("🚨 Memeriksa siklus cooldown koin, faucet, dan aset yang siap diklaim / di-swap...")
    projects = get_existing_projects()
    keywords = ["faucet", "claim", "swap", "withdraw", "mint", "redeem", "harvest", "feed", "reward"]

    cache = load_claim_cache()
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    due_items = []

    for p in projects:
        intel = p.get("intel_data") or {}
        tasks = intel.get("tasks") or []
        for t in tasks:
            t_name = str(t.get("name", "")).strip()
            t_type = str(t.get("type", "")).strip().lower()
            t_status = str(t.get("status", "")).strip().lower()
            t_interval = str(t.get("interval", "24h")).strip()

            if t_status in ("ready", "operational") or any(k in t_name.lower() or k in t_type for k in keywords):
                if any(k in t_name.lower() or k in t_type for k in keywords):
                    item_key = f"{p['name']}::{t_name}"
                    interval_hours = parse_interval_hours(t_interval)

                    # Check cooldown against cache
                    last_alerted_str = cache.get(item_key, {}).get("last_alerted_at")
                    is_due = False

                    if force or not last_alerted_str:
                        is_due = True
                    else:
                        try:
                            last_alerted_dt = datetime.datetime.fromisoformat(last_alerted_str)
                            hours_passed = (now_utc - last_alerted_dt).total_seconds() / 3600.0
                            if hours_passed >= interval_hours:
                                is_due = True
                        except Exception:
                            is_due = True

                    if is_due:
                        due_items.append({
                            "key": item_key,
                            "project": p["name"],
                            "task": t_name,
                            "token": intel.get("reward_token") or "$ALPHA",
                            "network": intel.get("network") or intel.get("network_type") or "Web3 EVM",
                            "url": intel.get("dashboard_url") or DASHBOARD_BASE_URL,
                            "interval": t_interval,
                            "interval_hours": interval_hours,
                        })

    if len(due_items) > 0:
        Log.success(f"Ditemukan {len(due_items)} aset/faucet/NFT yang SUDAH WAKTUNYA diklaim!")

        fields = []
        for item in due_items[:6]:
            fields.append({
                "name": f"🪙 {item['project']} — {item['task']}",
                "value": (
                    f"**Reward / Token:** `{item['token']}` | **Network:** `{item['network']}`\n"
                    f"⏳ **Siklus Cooldown:** `{item['interval']}` (Cooldown selesai, siap diklaim!)\n"
                    f"🔗 **Link Klaim Langsung:** [Buka Portal Resmi]({item['url']})"
                ),
                "inline": False,
            })

        embed = {
            "title": f"🚨 [WAKTUNYA KLAIM!] {len(due_items)} Aset & Faucet Siap Diambil!",
            "description": (
                f"Berdasarkan jadwal data info cooldown, **{len(due_items)} tugas klaim koin/NFT/swap** "
                f"telah mencapai waktu eksekusi dan siap Anda ambil sekarang:\n\n"
                f"🔗 [Buka Vault Koin & Faucet]({DASHBOARD_BASE_URL}/assets)\n"
                f"⚡ [Buka Command Center]({DASHBOARD_BASE_URL}/command)"
            ),
            "color": 0xEF4444,  # Neon Red (Urgent)
            "fields": fields,
            "footer": {
                "text": f"dcasper3 Cooldown Engine • Dolphin Profile {DOLPHIN_PROFILE_ID} • {get_current_wib_time()}"
            },
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }

        content_alert = (
            f"🚨🚨🚨 **[ALERT: WAKTUNYA KLAIM ASSET & NFT]** 🚨🚨🚨\n"
            f"Waktunya klaim aset harian & panen reward airdrop Anda! "
            f"Terdapat **{len(due_items)} garapan** yang cooldown-nya sudah selesai:"
        )

        send_discord_chat(content=content_alert, embeds=[embed])

        # Update cache to avoid spam until next interval
        for item in due_items:
            cache[item["key"]] = {
                "last_alerted_at": now_utc.isoformat(),
                "interval_hours": item["interval_hours"],
                "project": item["project"],
                "task": item["task"]
            }
        save_claim_cache(cache)

        return len(due_items)
    else:
        Log.info("Belum ada faucet atau aset baru yang mencapai jadwal waktu klaim (semua masih dalam siklus cooldown).")
        return 0


# ==============================================================================
# CLI DISPATCHER
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="dcasper3 Discord Intel and Reminder Agent")
    parser.add_argument("--scan", action="store_true", help="Run one Radar scan iteration")
    parser.add_argument("--remind", action="store_true", help="Run one execution reminder check")
    parser.add_argument("--hourly", action="store_true", help="Run Hourly Recap (Rekapan Per Jam)")
    parser.add_argument("--urgent-check", action="store_true", help="Run urgent asset claim / swap alert")
    parser.add_argument("--test-discord", action="store_true", help="Send test handshake to Discord")
    parser.add_argument("--webhook", type=str, help="Specify Discord Webhook URL directly")
    parser.add_argument("--loop", action="store_true", help="Run continuous background scanning loop aligned with 00, 20, 40")
    parser.add_argument("--interval", type=int, default=1200, help="Scan interval in seconds (default: 1200s / 20m)")

    args = parser.parse_args()

    global DISCORD_WEBHOOK_URL
    if args.webhook:
        DISCORD_WEBHOOK_URL = args.webhook

    Log.info("dcasper3 Discord Agent Initialized.")
    Log.info(f"Supabase Target: {SUPABASE_URL}")
    Log.info(f"Webhook Configured: {'YES' if DISCORD_WEBHOOK_URL else 'NO (Set in .env.local: DISCORD_WEBHOOK_URL)'}")

    if args.test_discord:
        send_discord_chat("🚀 **dcasper3 Discord Agent Connected!** Bot berhasil terhubung ke server Discord Anda.")
        return

    if args.urgent_check:
        check_urgent_asset_claims(force=True)
        return

    if args.hourly:
        execute_hourly_recap()
        check_execution_reminders()
        check_urgent_asset_claims(force=False)
        return

    if args.scan:
        scan_airdrop_opportunities()
        return

    if args.remind:
        check_execution_reminders()
        return

    if args.loop:
        Log.info("Starting continuous loop synchronized with wall-clock minutes 00, 20, 40...")
        while True:
            now_m = datetime.datetime.now(WIB).minute
            if now_m in (58, 59, 0, 1, 2):
                execute_hourly_recap()
            else:
                scan_airdrop_opportunities()
            check_execution_reminders()
            check_urgent_asset_claims(force=False)

            # Sleep until next 20-minute slot (:00, :20, :40)
            now_dt = datetime.datetime.now(WIB)
            rem_sec = (20 - (now_dt.minute % 20)) * 60 - now_dt.second
            if rem_sec <= 0:
                rem_sec = 1200
            Log.info(f"Sleeping {rem_sec}s until next aligned tick (:00, :20, :40)...")
            time.sleep(rem_sec)

    # Default action if called by Windows Task Scheduler:
    # Auto-detect minute: If at minute 00 (58..02), run Hourly Recap; otherwise run 20-min scan
    now_min = datetime.datetime.now(WIB).minute
    if now_min in (58, 59, 0, 1, 2):
        Log.info(f"Deteksi menit ke-{now_min} (ekor 00): Menjalankan Rekapan Per Jam!")
        execute_hourly_recap()
    else:
        Log.info(f"Deteksi menit ke-{now_min} (ekor 20/40): Menjalankan scan radar rutin 20 menit...")
        scan_airdrop_opportunities()

    check_execution_reminders()
    check_urgent_asset_claims(force=False)


if __name__ == "__main__":
    main()



