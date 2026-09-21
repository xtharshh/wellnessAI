import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Production API client (Neon via Vercel serverless) ─────────────
// Base URL resolution:
// - EXPO_PUBLIC_API_URL set → use it (native dev, staging, custom domains)
// - Web without env → same-origin relative '/api' (Vercel hosts API + web together)
// - Native without env → explicit error telling the dev what to set.
const TOKEN_KEY = 'mindtrace_session_token';

export function apiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env && env.trim().length > 0) return env.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  throw new Error(
    'API URL is not configured. Set EXPO_PUBLIC_API_URL to your Vercel deployment (e.g. https://your-app.vercel.app).'
  );
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface FetchOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** default true — pass false for public endpoints (doctors directory) */
  auth?: boolean;
  /** request timeout ms (default 12000 — failed servers must fail fast, never hang hydration) */
  timeoutMs?: number;
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== false) {
    const token = await getToken();
    if (!token) throw new ApiError(401, 'Not signed in.');
    headers.Authorization = `Bearer ${token}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 12000);
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    if ((e as any)?.name === 'AbortError') {
      throw new ApiError(0, 'Server is taking too long. Is the API running and reachable?');
    }
    throw new ApiError(0, 'Cannot reach the server. Check your connection and API URL.');
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as any)?.error || `Request failed (${res.status})`);
  }
  return data as T;
}
