-- ==============================================================================
-- Web3 Intelligence & Auto-Farming Command Center - Supabase Schema DDL
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running (safe cascade)
DROP TABLE IF EXISTS public.farming_logs CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- ==============================================================================
-- 3. Table Definitions
-- ==============================================================================

-- Table: projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    intel_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'idle',
    command_payload TEXT,
    lifecycle_stage TEXT DEFAULT 'scouted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: wallets
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: farming_logs
CREATE TABLE public.farming_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    log_message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'info',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_farming_logs_project_id ON public.farming_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_farming_logs_timestamp ON public.farming_logs(timestamp DESC);

-- ==============================================================================
-- 4. Row Level Security (RLS) Configuration - Open for MVP
-- ==============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farming_logs ENABLE ROW LEVEL SECURITY;

-- Policies for 'projects'
CREATE POLICY "Allow public read access on projects" 
    ON public.projects FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on projects" 
    ON public.projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on projects" 
    ON public.projects FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access on projects" 
    ON public.projects FOR DELETE USING (true);

-- Policies for 'wallets'
CREATE POLICY "Allow public read access on wallets" 
    ON public.wallets FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on wallets" 
    ON public.wallets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on wallets" 
    ON public.wallets FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access on wallets" 
    ON public.wallets FOR DELETE USING (true);

-- Policies for 'farming_logs'
CREATE POLICY "Allow public read access on farming_logs" 
    ON public.farming_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on farming_logs" 
    ON public.farming_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on farming_logs" 
    ON public.farming_logs FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access on farming_logs" 
    ON public.farming_logs FOR DELETE USING (true);

-- ==============================================================================
-- 5. Seed Data (Individual Statements with Dollar-Quoted JSON for 100% Reliability)
-- ==============================================================================

-- Seed Wallets (Single statement per record)
INSERT INTO public.wallets (id, address, label, status) 
VALUES ('11111111-1111-4111-a111-111111111111', '0x71C83605E6eE5852b71ebE283594b29cba8E8651', 'Primary Sybil Master (EVM)', 'active');

INSERT INTO public.wallets (id, address, label, status) 
VALUES ('22222222-2222-4222-a222-222222222222', '0x992B215E9F80327660c2830f3D5dDE9f83C7E142', 'Solana High-Tier Agent', 'active');

INSERT INTO public.wallets (id, address, label, status) 
VALUES ('33333333-3333-4333-a333-333333333333', '0x3E1Ac986d4838634C2d3851cb7e4F4750B1B3f38', 'DePIN Bandwidth Node #4', 'active');

INSERT INTO public.wallets (id, address, label, status) 
VALUES ('44444444-4444-4444-a444-444444444444', '0x5C8081f215EBeff271A3781216B512140D878d2B', 'Monad Testnet Faucet Farmer', 'cooldown');

-- Project 1: Grass Network
INSERT INTO public.projects (id, name, type, status, command_payload, intel_data)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Grass Network (GetGrass.io)',
    'DePIN Bandwidth Mining',
    'idle',
    '--task=uptime_check --report_points=true --verify_epoch',
    $json$
    {
        "tier": "Tier 1 - Alpha Node",
        "epoch": "Stage 2 - Epoch 3",
        "score": 48250,
        "reward_token": "GRASS",
        "network_quality": "98%",
        "dashboard_url": "https://app.getgrass.io/dashboard",
        "assigned_profile_id": "862684906",
        "tasks": [
            {"name": "WebSocket Uptime Heartbeat", "status": "operational", "interval": "continuous"},
            {"name": "Daily Referral Bonus Claim", "status": "ready", "interval": "24h"},
            {"name": "IP Reputation Health Check", "status": "clean", "last_verified": "2026-09-14T02:00:00Z"}
        ],
        "metrics": {
            "uptime_hours_today": 23.4,
            "bandwidth_shared_gb": 4.12,
            "current_multiplier": "1.25x"
        },
        "credentials_ref": "dolphin_profile_862684906"
    }
    $json$::jsonb
);

-- Project 2: Nodepay.ai Network
INSERT INTO public.projects (id, name, type, status, command_payload, intel_data)
VALUES (
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Nodepay.ai Network',
    'AI Data Training / DePIN',
    'idle',
    '--task=claim_daily --proof_of_connection --heartbeat',
    $json$
    {
        "tier": "Gold Validator Candidate",
        "season": "Season 1 AI Pre-Mining",
        "score": 19420,
        "reward_token": "NODEPAY",
        "dashboard_url": "https://app.nodepay.ai/dashboard",
        "assigned_profile_id": "862684906",
        "tasks": [
            {"name": "Daily Mission Check-in", "status": "pending_daily", "interval": "24h"},
            {"name": "Ping Node Verification", "status": "active", "interval": "10m"},
            {"name": "Twitter Social Task Sync", "status": "completed", "interval": "once"}
        ],
        "metrics": {
            "today_points": 820,
            "nodes_online": 3,
            "latency_ms": 42
        },
        "notes": "Requires clean residential proxy or local Dolphin Anty session."
    }
    $json$::jsonb
);

-- Project 3: Monad Ecosystem Testnet
INSERT INTO public.projects (id, name, type, status, command_payload, intel_data)
VALUES (
    'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f',
    'Monad Ecosystem Testnet',
    'EVM L1 Airdrop Campaign',
    'idle',
    '--task=faucet_request --execute_dex_swap --amount=0.05',
    $json$
    {
        "tier": "Early Testnet Participant",
        "network": "Monad Testnet (Chain ID: 10143)",
        "rpc_url": "https://testnet-rpc.monad.xyz",
        "dashboard_url": "https://monad.xyz/ecosystem",
        "assigned_profile_id": "862684906",
        "assigned_wallet": "0x71C83605E6eE5852b71ebE283594b29cba8E8651",
        "tasks": [
            {"name": "Claim MON Testnet Faucet", "status": "cooling_down", "cooldown_hrs": 6},
            {"name": "MonadSwap Liquidity Interaction", "status": "ready", "type": "contract_call"},
            {"name": "Deploy Test Token Contract", "status": "completed", "tx_hash": "0x3f1c9...89b"}
        ],
        "metrics": {
            "tx_count": 87,
            "unique_contract_interactions": 14,
            "estimated_gas_spent_mon": "1.42"
        }
    }
    $json$::jsonb
);

-- Project 4: Layer3 Protocol Quests
INSERT INTO public.projects (id, name, type, status, command_payload, intel_data)
VALUES (
    'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a',
    'Layer3 Protocol Quests',
    'Multi-Chain Quest Farming',
    'idle',
    '--task=streak_checkin --verify_active_cubes',
    $json$
    {
        "tier": "Level 34 Explorer",
        "streaks_days": 42,
        "total_cubes_minted": 18,
        "dashboard_url": "https://layer3.xyz",
        "assigned_profile_id": "862684906",
        "tasks": [
            {"name": "Maintain Daily GM Streak", "status": "ready", "interval": "24h"},
            {"name": "Arbitrum Stylus Quest Quiz", "status": "ready", "reward": "500 XP"},
            {"name": "Base Chain Bridge Verification", "status": "completed", "reward": "Cube NFT"}
        ],
        "metrics": {
            "total_xp": 145200,
            "gems_balance": 1850,
            "current_rank": "Top 1.5%"
        }
    }
    $json$::jsonb
);

-- Seed Initial Farming Logs
INSERT INTO public.farming_logs (project_id, log_message, status, timestamp) 
VALUES ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Initial system sync: Grass Network heartbeat established with 98% quality.', 'success', timezone('utc'::text, now()) - interval '1 hour');

INSERT INTO public.farming_logs (project_id, log_message, status, timestamp) 
VALUES ('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'Worker verified connection with Nodepay AI validator network.', 'info', timezone('utc'::text, now()) - interval '45 minutes');

INSERT INTO public.farming_logs (project_id, log_message, status, timestamp) 
VALUES ('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'Faucet cooldown active: 6 hours remaining before next batch execution.', 'info', timezone('utc'::text, now()) - interval '30 minutes');

INSERT INTO public.farming_logs (project_id, log_message, status, timestamp) 
VALUES ('d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', 'Layer3 GM Streak preserved (Day 42 validated). Cube verification passed.', 'success', timezone('utc'::text, now()) - interval '15 minutes');
