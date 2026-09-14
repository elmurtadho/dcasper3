import { createClient } from "@supabase/supabase-js";

// Credential resolution with direct fallback to ensure 100% reliability
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://udnyimtjrfbetxpgvegw.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbnlpbXRqcmZiZXR4cGd2ZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTU4MDAsImV4cCI6MjEwNDg3MTgwMH0.5GjKin7V7uNU9NoeIcVXhZzoo6yYAfWGM4l0vxS_J2I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// TypeScript interfaces matching Database Schema
export interface IntelData {
  tier?: string;
  epoch?: string;
  season?: string;
  score?: number;
  reward_token?: string;
  network_quality?: string;
  network?: string;
  network_type?: string;
  budget_requirement?: string;
  capital_cost?: string;
  farming_type?: string;
  estimated_return?: string;
  rpc_url?: string;
  dashboard_url?: string;
  assigned_profile_id?: string;
  assigned_wallet?: string;
  streaks_days?: number;
  total_cubes_minted?: number;
  tasks?: Array<{
    name: string;
    status: "operational" | "ready" | "pending_daily" | "completed" | "cooling_down" | string;
    interval?: string;
    last_verified?: string;
    reward?: string;
    type?: string;
    tx_hash?: string;
    cooldown_hrs?: number;
    cost?: string;
    score?: string | number;
    [key: string]: unknown;
  }>;
  metrics?: Record<string, string | number>;
  notes?: string;
  credentials_ref?: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  intel_data: IntelData;
  status: "idle" | "pending_execution" | "running" | "completed" | "failed" | string;
  command_payload: string | null;
  lifecycle_stage?: "scouted" | "active" | "ignored" | string;
  created_at: string;
  updated_at?: string;
}

export interface Wallet {
  id: string;
  address: string;
  label: string;
  status: "active" | "cooldown" | "banned" | string;
  created_at: string;
}

export interface FarmingLog {
  id: string;
  project_id: string;
  log_message: string;
  status: "info" | "success" | "warning" | "error" | string;
  timestamp: string;
}
