import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./auth";

export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface AuthRegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface Project {
  id: string;
  name: string;
  user_id: string;
  api_keys: number;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  project_id: string;
  revoked: boolean;
  created_at: string;
}

export interface CreateApiKeyResponse {
  message: string;
  api_key: string;
}

export interface Log {
  id: string;
  path: string;
  status: number;
  location: string;
  timestamp: string;
  latency: number;
  api_key: string;
}

export interface PaginatedLogs {
  logs: Log[];
  page: number;
  items: number;
  total_items: number;
}

export interface LogChartBar {
  status: number;
  count?: number;
}

export interface LogChart {
  date: string;
  logs: LogChartBar[];
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data: AuthTokens = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  } finally {
    refreshPromise = null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  console.log(BASE_URL + path, options);
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens();
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ── User types ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  profile_picture: string;
  role: string;
  joined_at: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
}

// ── User endpoints ──────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/api/v1/users/me");
}

export async function updateUser(data: UpdateUserRequest): Promise<void> {
  return apiFetch<void>("/api/v1/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(): Promise<void> {
  return apiFetch<void>("/api/v1/users/me", {
    method: "DELETE",
  });
}

// ── Auth endpoints ───────────────────────────────────────────────────────────

export async function register(
  data: AuthRegisterRequest,
): Promise<{ email: string; message: string }> {
  return apiFetch<{ email: string; message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyOTP(
  email: string,
  otp: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendOTP(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function login(data: AuthLoginRequest): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function googleLogin(code: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/google/callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// ── Project endpoints ────────────────────────────────────────────────────────

export async function createProject(
  name: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/projects/create", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/v1/projects/all");
}

// ── API Key endpoints ────────────────────────────────────────────────────────

export async function createApiKey(
  name: string,
  project_id: string,
): Promise<CreateApiKeyResponse> {
  return apiFetch<CreateApiKeyResponse>("/api/v1/api-keys/create", {
    method: "POST",
    body: JSON.stringify({ name, project_id }),
  });
}

export async function getApiKeys(projectId: string): Promise<ApiKey[]> {
  return apiFetch<ApiKey[]>(`/api/v1/api-keys/all/${projectId}`);
}

export async function revokeApiKey(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/api-keys/revoke/${id}`, {
    method: "PATCH",
  });
}

export async function deleteApiKey(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/api-keys/${id}`, {
    method: "DELETE",
  });
}

// ── Log endpoints ────────────────────────────────────────────────────────────

export async function getLogs(
  projectId: string,
  page = 1,
  limit = 10,
  startDate?: string,
  endDate?: string,
  statusCode?: string,
  apiKeyType?: string,
): Promise<PaginatedLogs> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (statusCode) params.set("statusCode", statusCode);
  if (apiKeyType) params.set("type", apiKeyType);
  return apiFetch<PaginatedLogs>(
    `/api/v1/logs/all/${projectId}?${params.toString()}`,
  );
}

export async function getLogsChart(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<LogChart[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();

  return apiFetch<LogChart[]>(
    `/api/v1/logs/chart/${projectId}${query ? `?${query}` : ""}`,
  );
}
