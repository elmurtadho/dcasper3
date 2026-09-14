-- ==============================================================================
-- Web3 Intelligence & Auto-Farming Command Center - Database Migration
-- Feature: Multi-Stage Lifecycle Classification (Scouted -> Active -> Ignored)
-- ==============================================================================

-- 1. Add lifecycle_stage column to 'projects' table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'scouted';

-- 2. Create index for fast filtering on lifecycle_stage
CREATE INDEX IF NOT EXISTS idx_projects_lifecycle_stage 
ON public.projects(lifecycle_stage);

-- 3. Update existing projects to set their appropriate lifecycle_stage
-- Active Projects (Ready for Command Center & Dolphin execution):
UPDATE public.projects 
SET lifecycle_stage = 'active' 
WHERE name LIKE '%Grass%' OR name LIKE '%Nodepay%';

-- Scouted Projects (Displayed in Intel Radar for sorting and evaluation):
UPDATE public.projects 
SET lifecycle_stage = 'scouted' 
WHERE name LIKE '%Monad%' OR name LIKE '%Layer3%';

-- 4. Seed Additional Scouted Web3 Opportunities for Intel Radar
-- Project: Berachain Proof-of-Liquidity Testnet
INSERT INTO public.projects (id, name, type, status, lifecycle_stage, command_payload, intel_data)
VALUES (
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Berachain Artio (PoL Testnet)',
    'EVM L1 Proof-of-Liquidity',
    'idle',
    'scouted',
    '--task=faucet_claim --swap_honey --mint_bgt',
    $json$
    {
        "tier": "Tier 1 - High Value Alpha",
        "network": "Berachain Bartio (Chain ID: 80084)",
        "network_type": "EVM Cosmos-SDK",
        "budget_requirement": "Zero Budget (Free Faucet)",
        "capital_cost": "0 USD",
        "farming_type": "DEX Swap & Liquidity Minting",
        "reward_token": "BERA / BGT",
        "estimated_return": "$1,500 - $4,000",
        "dashboard_url": "https://artio.faucet.berachain.com",
        "assigned_profile_id": "862684906",
        "tasks": [
            {"name": "Request 0.1 BERA from Testnet Faucet", "status": "ready", "interval": "8h"},
            {"name": "BEX Swap BERA -> HONEY Stablecoin", "status": "ready", "type": "dex_interaction"},
            {"name": "Bend Deposit HONEY to Mint BGT", "status": "pending", "type": "yield_farming"}
        ],
        "metrics": {
            "backed_funding": "$142M",
            "lead_investors": "Polychain, Brevan Howard, Framework",
            "ecosystem_status": "Pre-Mainnet Stage"
        },
        "notes": "Highly anticipated L1 airdrop. Zero capital required using faucet tokens."
    }
    $json$::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Project: Scroll Canvas & Session Badges
INSERT INTO public.projects (id, name, type, status, lifecycle_stage, command_payload, intel_data)
VALUES (
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'Scroll Canvas (ZK-Rollup Badges)',
    'Ethereum ZK-Rollup L2',
    'idle',
    'scouted',
    '--task=mint_canvas_profile --verify_attestations',
    $json$
    {
        "tier": "Tier 2 - Identity Farming",
        "network": "Scroll Mainnet (Chain ID: 534352)",
        "network_type": "EVM zkEVM",
        "budget_requirement": "Micro Gas (~$1 - $2 ETH)",
        "capital_cost": "Low (~$2.00)",
        "farming_type": "On-chain Attestations & Badges",
        "reward_token": "SCR",
        "estimated_return": "$500 - $1,200",
        "dashboard_url": "https://scroll.io/canvas",
        "assigned_profile_id": "862684906",
        "tasks": [
            {"name": "Mint Scroll Canvas Profile NFT", "status": "ready", "cost": "0.0003 ETH"},
            {"name": "Claim Ethereum Year Badge Attestation", "status": "ready", "interval": "once"},
            {"name": "Gitcoin Passport Score Verification", "status": "completed", "score": "24.5"}
        ],
        "metrics": {
            "total_marks": 2840,
            "canvas_rank": "Top 8%",
            "network_gas_gwei": "0.04"
        },
        "notes": "ZK rollup ecosystem rewards based on on-chain credentials and badges."
    }
    $json$::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Project: Eclipse SVM (Solana VM on Ethereum)
INSERT INTO public.projects (id, name, type, status, lifecycle_stage, command_payload, intel_data)
VALUES (
    'a7b8c9d0-e1f2-4a3b-5c6d-7e8f9a0b1c2d',
    'Eclipse SVM Mainnet Launch',
    'SVM L2 on Ethereum',
    'idle',
    'scouted',
    '--task=bridge_eth --swap_lifinity_svm',
    $json$
    {
        "tier": "Tier 1 - High Conviction",
        "network": "Eclipse Mainnet",
        "network_type": "Solana Virtual Machine (SVM)",
        "budget_requirement": "Bridge Capital ($10 - $50)",
        "capital_cost": "Flexible ($10+)",
        "farming_type": "Bridge & DEX Volume Generation",
        "reward_token": "ECLIPSE",
        "estimated_return": "$2,000 - $5,000",
        "dashboard_url": "https://eclipse.builders",
        "assigned_profile_id": "862684906",
        "tasks": [
            {"name": "Bridge 0.01 ETH from Ethereum Mainnet", "status": "ready", "type": "bridge"},
            {"name": "Execute 5 DEX Swaps on Lifinity SVM", "status": "pending", "interval": "weekly"},
            {"name": "Deploy Turbo SVM Smart Contract", "status": "ready", "type": "developer_task"}
        ],
        "metrics": {
            "backed_funding": "$65M",
            "lead_investors": "Placeholder, Hack VC, Polychain",
            "tps_capacity": "40,000 TPS"
        },
        "notes": "Fastest L2 powered by Solana Virtual Machine settled on Ethereum."
    }
    $json$::jsonb
)
ON CONFLICT (id) DO NOTHING;
