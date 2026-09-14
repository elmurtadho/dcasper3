"use client";

// Operator Master Authentication Utility
// Default passkey fallback ensures 100% immediate functionality on Vercel
export const ADMIN_PASSKEY =
  process.env.NEXT_PUBLIC_ADMIN_PASSKEY ||
  process.env.ADMIN_PASSKEY ||
  "dcasper-admin-2026";

const AUTH_STORAGE_KEY = "dcasper_command_center_session";
const AUTH_COOKIE_NAME = "dcasper_auth_token";

export interface OperatorSession {
  authenticated: boolean;
  role: string;
  authenticatedAt: string;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const session: OperatorSession = JSON.parse(raw);
    return session && session.authenticated === true;
  } catch {
    return false;
  }
}

export function loginWithPasskey(inputPasskey: string): { success: boolean; error?: string } {
  if (!inputPasskey || inputPasskey.trim() === "") {
    return { success: false, error: "Passkey cannot be empty." };
  }

  if (inputPasskey.trim() === ADMIN_PASSKEY) {
    if (typeof window !== "undefined") {
      const session: OperatorSession = {
        authenticated: true,
        role: "SYSTEM_OPERATOR",
        authenticatedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      // Set simple cookie for middleware/server awareness
      document.cookie = `${AUTH_COOKIE_NAME}=authorized; path=/; max-age=86400; SameSite=Strict`;
    }
    return { success: true };
  }

  return { success: false, error: "Access Denied: Invalid Operator Passkey." };
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function getSessionDetails(): OperatorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
