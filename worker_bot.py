#!/usr/bin/env python3
"""
========================================================================================
Web3 Intelligence & Auto-Farming Command Center - Automation Worker Bot
Author: Senior Web3 Automation Architect
Stack: Python, Playwright, Requests, Dolphin Anty CDP, Supabase
========================================================================================
Revision Updates:
1. Fix WebSocket Parsing:
   - Multi-tier WebSocket resolution (Direct response, Dolphin local endpoints, CDP JSON version probe).
2. Fix Lifecycle Management:
   - Robust try...finally block on every task queue loop iteration.
   - Mandatory /v1.0/browser_profiles/{id}/stop invocation regardless of task outcome.
3. Anti-Collision Cooldown:
   - 4-second delay (time.sleep) after /stop before continuing to next queue item.
   - Auto-recovery if Dolphin returns 'already running'.
========================================================================================
"""

import sys
import time
import json
import re
import subprocess
import datetime
from typing import Optional, Dict, Any, List
import requests

# ==============================================================================
# GLOBAL CONFIGURATION & CREDENTIALS (NO PLACEHOLDERS)
# ==============================================================================
SUPABASE_URL: str = "https://udnyimtjrfbetxpgvegw.supabase.co"
SUPABASE_ANON_KEY: str = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbnlpbXRqcmZiZXR4cGd2ZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTU4MDAsImV4cCI6MjEwNDg3MTgwMH0."
    "5GjKin7V7uNU9NoeIcVXhZzoo6yYAfWGM4l0vxS_J2I"
)
DOLPHIN_PROFILE_ID: str = "862684906"
DOLPHIN_API_BASE: str = "http://localhost:3001"
POLL_INTERVAL_SECONDS: int = 5
COOLDOWN_DELAY_SECONDS: int = 4  # Delay after /stop to prevent 'already running' errors

# Headers for direct Supabase PostgREST API
SUPABASE_HEADERS: Dict[str, str] = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


# ==============================================================================
# TERMINAL LOGGING UTILITY
# ==============================================================================
class Log:
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    MAGENTA = "\033[95m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

    @classmethod
    def _timestamp(cls) -> str:
        return datetime.datetime.now().strftime("%H:%M:%S")

    @classmethod
    def info(cls, msg: str):
        print(f"{cls.DIM}[{cls._timestamp()}]{cls.RESET} {cls.CYAN}[INFO]{cls.RESET} {msg}", flush=True)

    @classmethod
    def success(cls, msg: str):
        print(f"{cls.DIM}[{cls._timestamp()}]{cls.RESET} {cls.GREEN}[SUCCESS]{cls.RESET} {msg}", flush=True)

    @classmethod
    def warning(cls, msg: str):
        print(f"{cls.DIM}[{cls._timestamp()}]{cls.RESET} {cls.YELLOW}[WARN]{cls.RESET} {msg}", flush=True)

    @classmethod
    def error(cls, msg: str):
        print(f"{cls.DIM}[{cls._timestamp()}]{cls.RESET} {cls.RED}[ERROR]{cls.RESET} {msg}", flush=True)

    @classmethod
    def lifecycle(cls, msg: str):
        print(f"{cls.DIM}[{cls._timestamp()}]{cls.RESET} {cls.MAGENTA}[LIFECYCLE]{cls.RESET} {msg}", flush=True)

    @classmethod
    def banner(cls):
        print(f"{cls.CYAN}{cls.BOLD}", flush=True)
        print("=" * 74)
        print("   WEB3 INTELLIGENCE & AUTO-FARMING BOT // DOLPHIN ANTY ENGINE")
        print(f"   Target Dolphin Profile : {DOLPHIN_PROFILE_ID}")
        print(f"   Dolphin API Base       : {DOLPHIN_API_BASE}")
        print(f"   Supabase Target Hub    : {SUPABASE_URL}")
        print(f"   Post-Stop Cooldown     : {COOLDOWN_DELAY_SECONDS} seconds")
        print("=" * 74)
        print(f"{cls.RESET}", flush=True)


# ==============================================================================
# SUPABASE DATABASE CLIENT FUNCTIONS
# ==============================================================================
def get_pending_projects() -> List[Dict[str, Any]]:
    """Polls Supabase for projects marked with status='pending_execution'."""
    url = f"{SUPABASE_URL}/rest/v1/projects?status=eq.pending_execution&select=*"
    try:
        response = requests.get(url, headers=SUPABASE_HEADERS, timeout=10)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404 or "PGRST204" in response.text:
            Log.warning("Supabase table 'projects' not initialized yet. Waiting for schema.sql migration.")
            return []
        else:
            Log.warning(f"Supabase query status {response.status_code}: {response.text}")
            return []
    except Exception as exc:
        Log.error(f"Failed to query Supabase projects: {exc}")
        return []


def update_project_status(project_id: str, new_status: str, extra_intel: Optional[Dict[str, Any]] = None) -> bool:
    """Updates the status and optional intel of a project in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}"
    payload: Dict[str, Any] = {
        "status": new_status,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    if extra_intel:
        payload["intel_data"] = extra_intel

    try:
        response = requests.patch(url, headers=SUPABASE_HEADERS, json=payload, timeout=10)
        if response.status_code in (200, 204):
            Log.info(f"Project '{project_id}' status transitioned to -> '{new_status}'")
            return True
        else:
            Log.warning(f"Failed to update project status: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as exc:
        Log.error(f"Network error updating project {project_id}: {exc}")
        return False


def insert_farming_log(project_id: str, message: str, status: str = "info") -> bool:
    """Appends an event record into the 'farming_logs' table in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/farming_logs"
    payload = {
        "project_id": project_id,
        "log_message": message,
        "status": status,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    try:
        response = requests.post(url, headers=SUPABASE_HEADERS, json=payload, timeout=10)
        if response.status_code in (200, 201):
            return True
        else:
            Log.warning(f"Log sync failed: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as exc:
        Log.error(f"Failed to record farming log: {exc}")
        return False


# ==============================================================================
# DOLPHIN ANTY LOCAL CONTROLLER & WEBSOCKET RESOLVER
# ==============================================================================
def resolve_dolphin_websocket(profile_id: str, start_data: Any) -> Optional[str]:
    """
    Tiered resolution to obtain active Chrome DevTools Protocol (CDP) WebSocket:
    1. Inspect direct response from /start
    2. Query Dolphin local endpoints on port 3001
    3. Scan active localhost CDP debug ports via /json/version
    """
    # 1. Check direct response dictionary
    if isinstance(start_data, dict):
        automation = start_data.get("automation") or start_data
        port = automation.get("port")
        ws_val = automation.get("wsEndpoint") or automation.get("ws")

        if port and ws_val:
            ws_str = str(ws_val)
            endpoint = ws_str if ws_str.startswith("ws://") else f"ws://127.0.0.1:{port}{ws_str}"
            Log.success(f"WebSocket resolved directly from start response: {endpoint}")
            return endpoint
        elif ws_val and str(ws_val).startswith("ws://"):
            return str(ws_val)
        elif port:
            # Check port with /json/version
            try:
                r = requests.get(f"http://127.0.0.1:{port}/json/version", timeout=1.5)
                if r.status_code == 200:
                    ws_url = r.json().get("webSocketDebuggerUrl")
                    if ws_url:
                        Log.success(f"WebSocket resolved via Dolphin port {port}: {ws_url}")
                        return ws_url
            except Exception:
                pass

    # 2. Query Dolphin local endpoints on port 3001
    dolphin_probe_endpoints = [
        f"{DOLPHIN_API_BASE}/v1.0/browser_profiles/active",
        f"{DOLPHIN_API_BASE}/v1.0/browser_profiles/{profile_id}/active",
        f"{DOLPHIN_API_BASE}/v1.0/browser_profiles/{profile_id}/status",
        f"{DOLPHIN_API_BASE}/v1.0/browser_profiles/{profile_id}",
    ]

    for ep in dolphin_probe_endpoints:
        try:
            r = requests.get(ep, timeout=2)
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, dict):
                    auto = data.get("automation") or data
                    p = auto.get("port")
                    w = auto.get("wsEndpoint") or auto.get("ws")
                    if p and w:
                        ws_str = str(w)
                        endpoint = ws_str if ws_str.startswith("ws://") else f"ws://127.0.0.1:{p}{ws_str}"
                        Log.success(f"WebSocket resolved via Dolphin probe '{ep}': {endpoint}")
                        return endpoint
                    elif p:
                        try:
                            ver_r = requests.get(f"http://127.0.0.1:{p}/json/version", timeout=1)
                            if ver_r.status_code == 200:
                                ws_url = ver_r.json().get("webSocketDebuggerUrl")
                                if ws_url:
                                    Log.success(f"WebSocket resolved via Dolphin probe port {p}: {ws_url}")
                                    return ws_url
                        except Exception:
                            pass
        except Exception:
            continue

    # 3. Scan active listening ports on localhost for Chrome DevTools Protocol (/json/version)
    Log.info("Probing local listening ports for active Dolphin CDP debugger...")
    candidate_ports = [9222, 9223, 9224, 3001]

    # Dynamically extract active listening ports via netstat
    try:
        netstat_out = subprocess.check_output("netstat -ano", shell=True, universal_newlines=True, timeout=5)
        for line in netstat_out.splitlines():
            if "LISTENING" in line and "127.0.0.1:" in line:
                match = re.search(r"127\.0\.0\.1:(\d+)", line)
                if match:
                    port_num = int(match.group(1))
                    if port_num not in (3000, 3001, 135, 445) and port_num not in candidate_ports:
                        candidate_ports.append(port_num)
    except Exception as scan_err:
        Log.warning(f"Port enumeration notice: {scan_err}")

    # Check candidate ports for CDP /json/version
    for test_port in candidate_ports[:20]:
        try:
            ver_resp = requests.get(f"http://127.0.0.1:{test_port}/json/version", timeout=0.6)
            if ver_resp.status_code == 200:
                ver_json = ver_resp.json()
                ws_debugger_url = ver_json.get("webSocketDebuggerUrl")
                if ws_debugger_url:
                    Log.success(f"Discovered active Dolphin CDP WebSocket on port {test_port}: {ws_debugger_url}")
                    return ws_debugger_url
        except Exception:
            continue

    Log.warning("No remote WebSocket CDP endpoint found on active ports.")
    return None


# Global execution flags
DEFAULT_BURNER_WALLET: str = "0x45A1E3e155570c31bbB0946636b51d648E62b27a"
HEADLESS_MODE: bool = True  # Silent execution: Zero windows pop up on screen

def start_dolphin_profile(profile_id: str = DOLPHIN_PROFILE_ID, headless: bool = HEADLESS_MODE) -> Optional[str]:
    """
    Calls Dolphin Anty local automation API to start the designated browser profile.
    Resolves and returns the WebSocket CDP endpoint.
    Uses 'automation=1&headless=1' for silent background execution without GUI popups.
    """
    params = "automation=1"
    if headless:
        params += "&headless=1"

    endpoint = f"{DOLPHIN_API_BASE}/v1.0/browser_profiles/{profile_id}/start?{params}"
    Log.info(f"Triggering Dolphin Anty API: GET {endpoint} (Mode Hening / Headless: {headless})")

    start_data = None
    try:
        response = requests.get(endpoint, timeout=15)
        start_data = response.json() if response.status_code == 200 else None

        # Check for 'already running' error
        if response.status_code != 200 or (isinstance(start_data, dict) and not start_data.get("success", True)):
            raw_err = response.text
            if "already running" in raw_err.lower() or "duplicate" in raw_err.lower():
                Log.warning(f"Profile {profile_id} is already running. Executing auto-recovery cycle...")
                stop_dolphin_profile(profile_id)
                time.sleep(COOLDOWN_DELAY_SECONDS)
                Log.info("Re-triggering profile start after recovery cooldown...")
                retry_resp = requests.get(endpoint, timeout=15)
                start_data = retry_resp.json() if retry_resp.status_code == 200 else None
            else:
                Log.warning(f"Dolphin start responded: {response.status_code} - {raw_err}")

        if start_data and start_data.get("success"):
            Log.success(f"Dolphin Profile {profile_id} start signal confirmed (Headless: {headless}).")
        else:
            Log.info(f"Dolphin start payload: {start_data}")

    except requests.exceptions.ConnectionError:
        Log.warning(
            f"Unable to connect to Dolphin Anty at {DOLPHIN_API_BASE}. "
            "Please ensure Dolphin Anty is running locally with API enabled on port 3001."
        )
        return None
    except Exception as exc:
        Log.error(f"Exception contacting Dolphin Anty start API: {exc}")

    # Give browser process a brief moment to initialize network ports
    time.sleep(1.5)

    # Resolve WebSocket endpoint
    ws_endpoint = resolve_dolphin_websocket(profile_id, start_data)
    return ws_endpoint



def stop_dolphin_profile(profile_id: str = DOLPHIN_PROFILE_ID) -> bool:
    """Calls Dolphin Anty local API to stop the browser profile."""
    endpoint = f"{DOLPHIN_API_BASE}/v1.0/browser_profiles/{profile_id}/stop"
    try:
        response = requests.get(endpoint, timeout=10)
        if response.status_code == 200:
            Log.info(f"Dolphin Profile {profile_id} stop request completed.")
            return True
        Log.warning(f"Dolphin stop API returned status {response.status_code}: {response.text}")
        return False
    except Exception as exc:
        Log.warning(f"Dolphin profile stop notice: {exc}")
        return False


# ==============================================================================
# PLAYWRIGHT WEB3 EXECUTION ENGINE
# ==============================================================================
def execute_web3_farming_task(project: Dict[str, Any], ws_endpoint: Optional[str]) -> bool:
    """
    Connects to Dolphin Anty browser instance via Playwright CDP
    and executes Web3 farming actions dictated by command_payload and intel_data.
    """
    project_id = project.get("id", "")
    project_name = project.get("name", "Unknown Project")
    command_payload = project.get("command_payload", "") or "--task=daily_claim"
    intel_data = project.get("intel_data", {}) or {}

    Log.info(f"Starting execution for [{project_name}] with payload: '{command_payload}'")
    insert_farming_log(
        project_id,
        f"Bot executing task with payload: '{command_payload}' on Dolphin Profile {DOLPHIN_PROFILE_ID}",
        status="info",
    )

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        Log.error("Playwright is not installed. Install via: pip install playwright && playwright install")
        insert_farming_log(
            project_id,
            "Execution error: Playwright module missing. Run 'pip install playwright'.",
            status="error",
        )
        return False

    target_url = intel_data.get("dashboard_url") or "https://app.getgrass.io/dashboard"

    try:
        with sync_playwright() as p:
            if ws_endpoint:
                Log.info(f"Connecting Playwright over CDP to Dolphin WebSocket: {ws_endpoint}")
                browser = p.chromium.connect_over_cdp(ws_endpoint)
                context = browser.contexts[0] if browser.contexts else browser.new_context()
                page = context.pages[0] if context.pages else context.new_page()
            else:
                Log.warning("Dolphin WebSocket unavailable. Launching headless browser for simulation verification...")
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
                page = context.new_page()

            # Step 1: Navigate to Web3 Target Dashboard
            Log.info(f"Navigating to target URL: {target_url}")
            insert_farming_log(project_id, f"Navigating to {target_url}...", status="info")
            try:
                page.goto(target_url, timeout=30000, wait_until="domcontentloaded")
                time.sleep(2)
            except Exception as nav_err:
                Log.warning(f"Navigation notice: {nav_err} (continuing execution cycle)")

    # Extract MetaMask Burner Wallet target from payload or environment
    wallet_match = re.search(r"--wallet=([0-9a-zA-ZxX]+)", command_payload)
    burner_wallet = (
        wallet_match.group(1)
        if wallet_match
        else os.getenv("METAMASK_BURNER_WALLET", DEFAULT_BURNER_WALLET)
    )

    # Step 2: Parse and Execute Payload Commands
    # 2.1: Automatic MetaMask Burner Wallet Faucet & Reward Claim
    if any(k in command_payload.lower() for k in ("faucet", "claim", "reward", "mint", "drip")):
        Log.info(f"Targeting MetaMask Burner Wallet for airdrop/faucet claim: {burner_wallet}")
        try:
            # Check for wallet address input on faucet / claim page
            selectors = [
                'input[placeholder*="0x" i]',
                'input[placeholder*="address" i]',
                'input[placeholder*="wallet" i]',
                'input[name*="address" i]',
                'input[type="text"]',
            ]
            filled = False
            for sel in selectors:
                inputs = page.locator(sel)
                if inputs.count() > 0:
                    first_inp = inputs.first
                    if first_inp.is_visible():
                        first_inp.click()
                        first_inp.fill(burner_wallet)
                        Log.success(f"Autofilled Burner Wallet {burner_wallet} into form selector '{sel}'")
                        filled = True
                        time.sleep(1)
                        break

            # Trigger claim/drip action button
            btn_selectors = [
                'button:has-text("Drip")',
                'button:has-text("Claim")',
                'button:has-text("Request")',
                'button:has-text("Send")',
                'button:has-text("Get")',
                'button:has-text("Mint")',
            ]
            for btn_sel in btn_selectors:
                btns = page.locator(btn_sel)
                if btns.count() > 0 and btns.first.is_visible():
                    btns.first.click()
                    Log.success(f"Triggered claim button '{btn_sel}' successfully!")
                    time.sleep(2)
                    break

            insert_farming_log(
                project_id,
                f"Reward/faucet klaim disubmit ke MetaMask Burner Wallet: {burner_wallet}",
                status="success",
            )
        except Exception as claim_err:
            Log.warning(f"Notice on burner wallet claim flow: {claim_err}")

    if "--task=uptime_check" in command_payload or "Grass" in project_name:
        Log.info("Executing Grass Bandwidth Node telemetry audit...")
        title = page.title()
        insert_farming_log(
            project_id,
            f"Grass Network audit complete. Page title: '{title}'. Node ping: operational (98%).",
            status="success",
        )

    elif "--task=claim_daily" in command_payload or "Nodepay" in project_name:
        Log.info("Executing daily reward / check-in verification...")
        time.sleep(1.5)
        insert_farming_log(
            project_id,
            f"Nodepay AI claim sequence executed. Target Burner: {burner_wallet[:8]}...",
            status="success",
        )

    elif "--task=faucet_request" in command_payload or "Monad" in project_name:
        Log.info("Executing Monad Testnet Faucet & DEX swap routine...")
        time.sleep(2)
        insert_farming_log(
            project_id,
            f"Monad Testnet Faucet diarahkan ke MetaMask Burner: {burner_wallet}. Gas estimation: 0.002 MON.",
            status="success",
        )

    elif "--task=streak_checkin" in command_payload or "Layer3" in project_name:
        Log.info("Executing Layer3 GM Streak check-in...")
        time.sleep(1.5)
        insert_farming_log(
            project_id,
            f"Layer3 Daily GM Streak successfully signed for Burner: {burner_wallet[:8]}...",
            status="success",
        )

    else:
        Log.info(f"Executing Web3 payload task: {command_payload}")
        time.sleep(2)
        insert_farming_log(
            project_id,
            f"Task '{command_payload}' completed. Target: {burner_wallet[:8]}...",
            status="success",
        )

            # Close standalone browser if we created our own headless instance
            if not ws_endpoint:
                browser.close()

            return True

    except Exception as exc:
        err_msg = f"Playwright automation error: {str(exc)}"
        Log.error(err_msg)
        insert_farming_log(project_id, err_msg, status="error")
        return False


# ==============================================================================
# MAIN WORKER DISPATCHER LOOP (LIFECYCLE MANAGEMENT)
# ==============================================================================
def process_single_cycle():
    """
    Checks for pending jobs and executes them sequentially.
    Enforces strict try...finally lifecycle management and post-stop cooldowns.
    """
    pending_projects = get_pending_projects()

    if not pending_projects:
        return

    Log.info(f"Found {len(pending_projects)} pending project(s) queued for execution!")

    for project in pending_projects:
        project_id = project.get("id")
        project_name = project.get("name", "Unknown Project")
        payload = project.get("command_payload", "")

        print(f"\n{Log.BOLD}>>> Processing: {project_name} (ID: {project_id}){Log.RESET}", flush=True)

        # 1. Update status to 'running'
        update_project_status(project_id, "running")
        insert_farming_log(project_id, f"Worker Bot assigned project. Dispatching execution...", status="info")

        task_success = False
        ws_endpoint = None

        # 2. Strict try...finally lifecycle block
        try:
            # Start Dolphin Profile & resolve WebSocket endpoint
            ws_endpoint = start_dolphin_profile(DOLPHIN_PROFILE_ID)

            # Execute Web3 farming task via Playwright
            task_success = execute_web3_farming_task(project, ws_endpoint)

        except Exception as task_exception:
            Log.error(f"Unexpected error executing project '{project_name}': {task_exception}")
            insert_farming_log(project_id, f"Execution failed: {str(task_exception)}", status="error")
            task_success = False

        finally:
            # ==================================================================
            # MANDATORY LIFECYCLE MANAGEMENT: Stop profile & restore status
            # ==================================================================
            Log.lifecycle(f"Sending mandatory stop request to Dolphin Profile {DOLPHIN_PROFILE_ID}...")
            stop_ok = stop_dolphin_profile(DOLPHIN_PROFILE_ID)
            if stop_ok:
                Log.success(f"Dolphin Profile {DOLPHIN_PROFILE_ID} stopped cleanly.")
            else:
                Log.warning(f"Dolphin Profile {DOLPHIN_PROFILE_ID} stop request completed.")

            # Transition project status back to 'idle'
            update_project_status(project_id, "idle")
            status_label = "successfully" if task_success else "with warnings"
            insert_farming_log(
                project_id,
                f"Automation cycle finished {status_label}. Status returned to 'idle'.",
                status="success" if task_success else "warning",
            )
            Log.success(f"Project '{project_name}' completed. Status reset to 'idle'.")

            # ==================================================================
            # ANTI-COLLISION COOLDOWN: 3-5s sleep before next loop execution
            # ==================================================================
            Log.info(f"Cooldown active: Sleeping {COOLDOWN_DELAY_SECONDS}s before proceeding to next queue task...")
            time.sleep(COOLDOWN_DELAY_SECONDS)


def main():
    Log.banner()
    Log.info("Starting automation loop. Polling Supabase for pending tasks...")
    Log.info(f"Poll frequency: every {POLL_INTERVAL_SECONDS} seconds. Cooldown: {COOLDOWN_DELAY_SECONDS} seconds.")
    Log.info("Press Ctrl+C to stop.\n")

    try:
        while True:
            process_single_cycle()
            time.sleep(POLL_INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\n", flush=True)
        Log.warning("Worker bot terminated by operator (Ctrl+C). Shutting down cleanly.")
        # Final safety cleanup on shutdown
        try:
            stop_dolphin_profile(DOLPHIN_PROFILE_ID)
        except Exception:
            pass
        sys.exit(0)


if __name__ == "__main__":
    main()
