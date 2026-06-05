import { getJson, removeKey, setJson, STORAGE_KEYS } from '@/src/services/storage';
import { UserProfile, UserSettings } from '@/src/types/wellness';

function hashPassword(password: string): string {
  return `hash:${password.split('').reverse().join('')}:${password.length}`;
}

export async function getUsers(): Promise<UserProfile[]> {
  return getJson<UserProfile[]>(STORAGE_KEYS.users, []);
}

export async function saveUsers(users: UserProfile[]): Promise<void> {
  await setJson(STORAGE_KEYS.users, users);
}

export async function getSessionUserId(): Promise<string | null> {
  return getJson<string | null>(STORAGE_KEYS.session, null);
}

export async function setSessionUserId(userId: string | null): Promise<void> {
  if (!userId) {
    await removeKey(STORAGE_KEYS.session);
    return;
  }
  await setJson(STORAGE_KEYS.session, userId);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const users = await getUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserProfile> {
  const users = await getUsers();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const user: UserProfile = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    displayName: input.displayName.trim(),
    passwordHash: hashPassword(input.password),
    privacyConsentAt: null,
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  await setSessionUserId(user.id);
  return user;
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  const users = await getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new Error('Invalid email or password.');
  }

  await setSessionUserId(user.id);
  return user;
}

export async function signOut(): Promise<void> {
  await setSessionUserId(null);
}

export async function updateUser(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) throw new Error('User not found.');

  users[index] = { ...users[index], ...patch };
  await saveUsers(users);
  return users[index];
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const all = await getJson<Record<string, UserSettings>>(STORAGE_KEYS.settings, {});
  return (
    all[userId] ?? {
      notificationsEnabled: true,
      dataSharingEnabled: false,
      theme: 'dark',
    }
  );
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  const all = await getJson<Record<string, UserSettings>>(STORAGE_KEYS.settings, {});
  all[userId] = settings;
  await setJson(STORAGE_KEYS.settings, all);
}
