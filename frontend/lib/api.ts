"use client";

// ==============================================================================
// DataNarrator backend API client
// All requests go to "/api/*", which next.config.mjs proxies to the Flask
// backend (BACKEND_URL, default http://127.0.0.1:5000).
// ==============================================================================

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

const STORAGE_KEY_TOKEN = "datanarrator_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  } catch {
    // ignore storage error
  }
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  method?: string;
  body?: any; // plain object (sent as JSON) or FormData
  auth?: boolean; // default true
  raw?: boolean; // return the Response (for file downloads)
};

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, raw = false } = options;
  const headers: Record<string, string> = {};

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch (e) {
    throw new ApiError("Cannot reach the DataNarrator server. Please make sure the backend is running.", 0, null);
  }

  if (raw && response.ok) return response as unknown as T;

  let data: any = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const message =
      data?.error || data?.message || data?.msg || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/** Download a binary response (PNG / PDF) as a file in the browser. */
export async function apiDownload(path: string, body: any, fileName: string): Promise<void> {
  const response = await apiRequest<Response>(path, { method: "POST", body, raw: true });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Backend keys columns as "Name (column 3)" — strip that suffix. */
export function cleanColumnKey(key: string): string {
  return String(key).replace(/\s*\(column \d+\)$/, "");
}

// ------------------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------------------
export const authApi = {
  login: (login: string, password: string) =>
    apiRequest<{ access_token: string; user_id: number; role: string }>("/login", {
      method: "POST",
      body: { login, password },
      auth: false,
    }),
  register: (username: string, email: string, password: string) =>
    apiRequest<{ user_id: number }>("/register", {
      method: "POST",
      body: { username, email, password },
      auth: false,
    }),
};

// ------------------------------------------------------------------------------
// Settings
// ------------------------------------------------------------------------------
export interface BackendProfile {
  id: number;
  username: string;
  email: string;
  display_name: string;
  profile_image?: string | null;
  role?: string;
}

export const settingsApi = {
  getProfile: () => apiRequest<{ profile: BackendProfile }>("/settings/profile"),
  updateProfile: (username: string, display_name: string) =>
    apiRequest<{ profile: BackendProfile }>("/settings/profile", {
      method: "PATCH",
      body: { username, display_name },
    }),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append("profile_image", file);
    return apiRequest("/settings/profile/photo", { method: "POST", body: form });
  },
  changePassword: (current_password: string, new_password: string, confirm_password: string) =>
    apiRequest("/settings/password", {
      method: "PATCH",
      body: { current_password, new_password, confirm_password },
    }),
  setChartColor: (chart_color: string) =>
    apiRequest("/settings/preferences/chart-color", { method: "PATCH", body: { chart_color } }),
  setCurrency: (currency: string) =>
    apiRequest("/settings/preferences/currency", { method: "PATCH", body: { currency } }),
  setNumberDisplay: (number_display: string) =>
    apiRequest("/settings/preferences/number-display", { method: "PATCH", body: { number_display } }),
  setTheme: (theme: string) =>
    apiRequest("/settings/preferences/theme", { method: "PATCH", body: { theme } }),
  logout: () => apiRequest("/settings/logout", { method: "POST" }),
  deleteAccount: (current_password: string) =>
    apiRequest("/settings/account", { method: "DELETE", body: { current_password } }),
};

// ------------------------------------------------------------------------------
// Datasets
// ------------------------------------------------------------------------------
export const datasetApi = {
  /** Reads the file and returns the full quality report (no persistence). */
  inspect: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest("/dataset/test-upload", { method: "POST", body: form, auth: false });
  },
  /** Saves the file for the logged in user and returns dataset_id. */
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<{ dataset_id: number; file_name: string }>("/dataset/upload", {
      method: "POST",
      body: form,
    });
  },
  columns: (id: number) => apiRequest<{ column_names: string[] }>(`/dataset/${id}/columns`),
  preview: (id: number) => apiRequest(`/dataset/${id}/preview`),
  aiRecommendColumns: (id: number) => apiRequest(`/dataset/${id}/ai-recommend-columns`),
  quickExamples: (id: number) => apiRequest(`/dataset/${id}/quick-examples`),
  selectColumns: (id: number, selected_columns: string[]) =>
    apiRequest(`/dataset/${id}/select-columns`, { method: "POST", body: { selected_columns } }),
  cleanMissing: (id: number, strategies: Record<string, string>) =>
    apiRequest(`/dataset/${id}/clean-missing`, { method: "POST", body: { strategies } }),
  detectDuplicateRows: (id: number) =>
    apiRequest(`/dataset/${id}/detect-duplicate-rows`, { method: "POST", body: {} }),
};

// ------------------------------------------------------------------------------
// Analysis
// ------------------------------------------------------------------------------

/** Frontend analysis ids -> backend analysis types */
export const ANALYSIS_TYPE_MAP: Record<string, string> = {
  trend: "descriptive",
  comparison: "comparative",
  desc_freq: "descriptive",
  desc_numeric: "distribution",
  correlation: "relationship",
  outlier: "outlier",
};

export const analysisApi = {
  recommend: (dataset_id: number, selected_columns: string[]) =>
    apiRequest<{ recommended_analysis_types: string[] }>("/analysis/recommend", {
      method: "POST",
      body: { dataset_id, selected_columns },
    }),
  aiRecommend: (dataset_id: number, selected_columns: string[]) =>
    apiRequest("/analysis/ai-recommend", { method: "POST", body: { dataset_id, selected_columns } }),
  execute: (dataset_id: number, selected_columns: string[], analysis_type: string) =>
    apiRequest("/analysis/execute", {
      method: "POST",
      body: { dataset_id, selected_columns, analysis_type },
    }),
  visualization: (analysis_session_id: number, chart_id: number, visualization_type: string) =>
    apiRequest("/analysis/visualization", {
      method: "POST",
      body: { analysis_session_id, chart_id, visualization_type },
    }),
  exportPng: (analysis_session_id: number, chart_id: number, visualization_type: string, fileName: string) =>
    apiDownload("/analysis/export/png", { analysis_session_id, chart_id, visualization_type }, fileName),
  exportPdf: (analysis_session_id: number, chart_id: number, visualization_type: string, fileName: string) =>
    apiDownload("/analysis/export/pdf", { analysis_session_id, chart_id, visualization_type }, fileName),
};

// ------------------------------------------------------------------------------
// Admin
// ------------------------------------------------------------------------------
export interface BackendUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const adminApi = {
  listUsers: () => apiRequest<{ users: BackendUser[] }>("/admin/users"),
  addUser: (username: string, email: string, password: string) =>
    apiRequest("/admin/users", { method: "POST", body: { username, email, password } }),
  deleteUser: (id: number) => apiRequest(`/admin/users/${id}`, { method: "DELETE" }),
  getUser: (id: number) => apiRequest(`/admin/users/${id}`),
};
