import { UserProfile, UserSettings } from '@/src/types/wellness';
import { apiFetch, setToken } from '@/src/services/apiClient';

interface AuthResponse {
  token: string;
  user: UserProfile;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const data = await apiFetch<{ user: UserProfile }>('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserProfile> {
  const data = await apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: input,
  });
  await setToken(data.token);
  return data.user;
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  await setToken(data.token);
  return data.user;
}

export async function signOut(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort server logout; always clear locally.
  }
  await setToken(null);
}

// Forgot-password: server sends the reset email when configured.
export async function resetPassword(email: string): Promise<void> {
  await apiFetch('/api/auth/forgot', { method: 'POST', auth: false, body: { email } });
}

export async function updateUser(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
  void userId; // server derives identity from the session token
  const data = await apiFetch<{ user: UserProfile }>('/api/auth/profile', {
    method: 'PATCH',
    body: patch,
  });
  return data.user;
}

export async function getSettings(userId: string): Promise<UserSettings> {
  void userId;
  try {
    const data = await apiFetch<{ settings: UserSettings }>('/api/settings');
    return data.settings;
  } catch {
    return { notificationsEnabled: true, dataSharingEnabled: false, theme: 'light' };
  }
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  void userId;
  await apiFetch('/api/settings', { method: 'PATCH', body: settings });
}
