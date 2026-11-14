"use client";

import { useState, useEffect } from "react";
import { authApi, settingsApi, setToken, getToken } from "@/lib/api";

export const STORAGE_KEY_AUTH = "datanarrator_user_logged_in";
export const STORAGE_KEY_USER_PROFILE = "datanarrator_user_profile";
export const EVENT_AUTH_CHANGED = "datanarrator_auth_changed";

export interface UserProfile {
  displayName: string;
  username: string;
  email: string;
  role?: "admin" | "user";
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// ==============================================================================
const DEFAULT_PROFILE: UserProfile = {
  displayName: "Shahad Saif",
  username: "shahad_saif",
  email: "shahad.saif@example.com",
  role: "user",
};

export const ADMIN_PROFILE: UserProfile = {
  displayName: "System Administrator",
  username: "admin",
  email: "admin@datanarrator.ai",
  role: "admin",
};

export function getStoredUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    const username = parsed.username || DEFAULT_PROFILE.username;
    const isAdminUser = username.toLowerCase() === "admin" || parsed.role === "admin";
    return {
      displayName: parsed.displayName || (isAdminUser ? ADMIN_PROFILE.displayName : DEFAULT_PROFILE.displayName),
      username,
      email: parsed.email || (isAdminUser ? ADMIN_PROFILE.email : DEFAULT_PROFILE.email),
      role: isAdminUser ? "admin" : (parsed.role || "user"),
    };
  } catch (e) {
    return DEFAULT_PROFILE;
  }
}

export function saveStoredUserProfile(profile: Partial<UserProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredUserProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
  } catch (e) {
    // ignore storage error
  }
}
// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

export function getIsLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const sessionVal = sessionStorage.getItem(STORAGE_KEY_AUTH);
    const localVal = localStorage.getItem(STORAGE_KEY_AUTH);
    return (sessionVal === "true" || localVal === "true") && !!getToken();
  } catch (e) {
    return false;
  }
}

export function setLoggedIn(loggedIn: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (loggedIn) {
      sessionStorage.setItem(STORAGE_KEY_AUTH, "true");
    } else {
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_AUTH);
      setToken(null);
    }
    window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
  } catch (e) {
    // ignore storage error
  }
}

export function logout(): void {
  // Notify backend (stateless JWT) then clear the local session
  if (getToken()) settingsApi.logout().catch(() => {});
  setLoggedIn(false);
}

// ==============================================================================
// Backend authentication (Flask /login, /register, /settings/profile)
// ==============================================================================

/** Log in against the backend, store the JWT and cache the user profile. */
export async function loginWithBackend(identifier: string, password: string): Promise<UserProfile> {
  const result = await authApi.login(identifier.trim(), password);
  setToken(result.access_token);
  const role: "admin" | "user" = result.role === "admin" ? "admin" : "user";

  let profile: UserProfile = {
    displayName: identifier.trim(),
    username: identifier.trim(),
    email: identifier.includes("@") ? identifier.trim() : "",
    role,
  };
  try {
    const { profile: p } = await settingsApi.getProfile();
    profile = {
      displayName: p.display_name || p.username,
      username: p.username,
      email: p.email,
      role,
    };
  } catch (e) {
    // keep the minimal profile
  }

  saveStoredUserProfile(profile);
  setLoggedIn(true);
  return profile;
}

/** Register a new account on the backend, then log in with it. */
export async function registerWithBackend(data: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}): Promise<UserProfile> {
  await authApi.register(data.username.trim(), data.email.trim(), data.password);
  const profile = await loginWithBackend(data.username, data.password);
  if (data.displayName && data.displayName.trim() && data.displayName.trim() !== profile.displayName) {
    try {
      await settingsApi.updateProfile(profile.username, data.displayName.trim());
      profile.displayName = data.displayName.trim();
      saveStoredUserProfile({ displayName: profile.displayName });
    } catch (e) {
      // display name is optional
    }
  }
  return profile;
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Mock Account Deletion Request Store (uses localStorage instead of database tables)
// ==============================================================================
export const STORAGE_KEY_DELETION_REQUESTS = "datanarrator_account_deletion_requests";
export const EVENT_DELETION_REQUESTS_CHANGED = "datanarrator_deletion_requests_changed";

export interface AccountDeletionRequest {
  id: string;
  username: string;
  userDisplayName: string;
  email: string;
  reason: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

export function getAccountDeletionRequests(): AccountDeletionRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETION_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveAccountDeletionRequests(requests: AccountDeletionRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_DELETION_REQUESTS, JSON.stringify(requests));
    window.dispatchEvent(new Event(EVENT_DELETION_REQUESTS_CHANGED));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    // ignore
  }
}

export function getPendingDeletionRequest(username: string): AccountDeletionRequest | null {
  const all = getAccountDeletionRequests();
  return all.find((r) => r.username.toLowerCase() === username.toLowerCase() && r.status === "pending") || null;
}

export function submitAccountDeletionRequest(data: {
  username: string;
  userDisplayName: string;
  email: string;
  reason: string;
}): AccountDeletionRequest {
  const requests = getAccountDeletionRequests();
  const filtered = requests.filter((r) => r.username.toLowerCase() !== data.username.toLowerCase());
  const newReq: AccountDeletionRequest = {
    id: `del-req-${Date.now()}`,
    username: data.username,
    userDisplayName: data.userDisplayName,
    email: data.email,
    reason: data.reason || "User requested account closure",
    requestedAt: new Date().toISOString(),
    status: "pending",
  };
  filtered.unshift(newReq);
  saveAccountDeletionRequests(filtered);

  try {
    const rawUsers = localStorage.getItem("datanarrator_admin_managed_users");
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const updatedUsers = users.map((u: any) =>
        u.username.toLowerCase() === data.username.toLowerCase()
          ? { ...u, status: "deletion_requested", deletionReason: newReq.reason, deletionRequestedAt: newReq.requestedAt }
          : u
      );
      localStorage.setItem("datanarrator_admin_managed_users", JSON.stringify(updatedUsers));
    }
  } catch (e) {
    // ignore
  }

  return newReq;
}

export function cancelAccountDeletionRequest(username: string): void {
  const requests = getAccountDeletionRequests();
  const updated = requests.filter((r) => r.username.toLowerCase() !== username.toLowerCase());
  saveAccountDeletionRequests(updated);

  try {
    const rawUsers = localStorage.getItem("datanarrator_admin_managed_users");
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const updatedUsers = users.map((u: any) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? { ...u, status: "active", deletionReason: undefined, deletionRequestedAt: undefined }
          : u
      );
      localStorage.setItem("datanarrator_admin_managed_users", JSON.stringify(updatedUsers));
    }
  } catch (e) {
    // ignore
  }
}

export function approveAccountDeletionRequest(username: string): void {
  const requests = getAccountDeletionRequests();
  const updated = requests.map((r) =>
    r.username.toLowerCase() === username.toLowerCase() ? { ...r, status: "approved" as const } : r
  );
  saveAccountDeletionRequests(updated);

  try {
    const rawUsers = localStorage.getItem("datanarrator_admin_managed_users");
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const updatedUsers = users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
      localStorage.setItem("datanarrator_admin_managed_users", JSON.stringify(updatedUsers));
    }
  } catch (e) {
    // ignore
  }

  const currentProfile = getStoredUserProfile();
  if (currentProfile.username.toLowerCase() === username.toLowerCase()) {
    logout();
  }
}

export function rejectAccountDeletionRequest(username: string): void {
  const requests = getAccountDeletionRequests();
  const updated = requests.filter((r) => r.username.toLowerCase() !== username.toLowerCase());
  saveAccountDeletionRequests(updated);

  try {
    const rawUsers = localStorage.getItem("datanarrator_admin_managed_users");
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const updatedUsers = users.map((u: any) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? { ...u, status: "active", deletionReason: undefined, deletionRequestedAt: undefined }
          : u
      );
      localStorage.setItem("datanarrator_admin_managed_users", JSON.stringify(updatedUsers));
    }
  } catch (e) {
    // ignore
  }
}

export function userDeleteAccount(profile: UserProfile): void {
  submitAccountDeletionRequest({
    username: profile.username,
    userDisplayName: profile.displayName || profile.username,
    email: profile.email || "user@example.com",
    reason: "User permanently deleted account from settings",
  });
  logout();
}
// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

export function login(): void {
  setLoggedIn(true);
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(false);
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoggedInState(getIsLoggedIn());
    setProfileState(getStoredUserProfile());
    setIsLoading(false);

    const handleAuthChange = () => {
      setIsLoggedInState(getIsLoggedIn());
      setProfileState(getStoredUserProfile());
    };

    window.addEventListener(EVENT_AUTH_CHANGED, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(EVENT_AUTH_CHANGED, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const isAdmin = profile.role === "admin" || profile.username.toLowerCase() === "admin";

  return {
    isLoggedIn,
    isAdmin,
    isGuest: !isLoggedIn,
    isLoading,
    profile,
    updateProfile: (p: Partial<UserProfile>) => saveStoredUserProfile(p),
    login: () => setLoggedIn(true),
    logout: () => logout(),
  };
}
