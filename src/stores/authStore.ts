import { create } from 'zustand';

import * as authService from '@/src/services/auth';
import * as recommendationsService from '@/src/services/recommendations';
import { ensureSnapshots } from '@/src/services/wellness';
import { UserProfile } from '@/src/types/wellness';

interface AuthState {
  user: UserProfile | null;
  theme: 'dark' | 'light';
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  acceptPrivacy: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  clearError: () => void;
}

async function bootstrapUserData(userId: string) {
  await ensureSnapshots(userId);
  await recommendationsService.generateRecommendations(userId);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  theme: 'light',
  hydrated: false,
  loading: false,
  error: null,

  hydrate: async () => {
    const user = await authService.getCurrentUser();
    let theme: 'dark' | 'light' = 'light';
    if (user) {
      await bootstrapUserData(user.id);
      try {
        const settings = await authService.getSettings(user.id);
        theme = (settings.theme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
      } catch (e) {
        console.error('Failed to load user theme setting:', e);
      }
    }
    set({ user, theme, hydrated: true });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      await bootstrapUserData(user.id);
      const settings = await authService.getSettings(user.id);
      const theme = (settings.theme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
      set({ user, theme, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed.',
      });
      throw error;
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signUp({ email, password, displayName });
      await bootstrapUserData(user.id);
      set({ user, theme: 'light', loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Sign up failed.',
      });
      throw error;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, theme: 'light' });
  },

  acceptPrivacy: async () => {
    const { user } = get();
    if (!user) return;
    const updated = await authService.updateUser(user.id, {
      privacyConsentAt: new Date().toISOString(),
    });
    set({ user: updated });
  },

  completeOnboarding: async () => {
    const { user } = get();
    if (!user) return;
    const updated = await authService.updateUser(user.id, { onboardingComplete: true });
    set({ user: updated });
  },

  updateDisplayName: async (displayName) => {
    const { user } = get();
    if (!user) return;
    const updated = await authService.updateUser(user.id, { displayName });
    set({ user: updated });
  },

  setTheme: async (theme) => {
    const { user } = get();
    if (user) {
      try {
        const settings = await authService.getSettings(user.id);
        await authService.saveSettings(user.id, {
          ...settings,
          theme,
        });
      } catch (e) {
        console.error('Failed to save user theme settings:', e);
      }
    }
    set({ theme });
  },

  clearError: () => set({ error: null }),
}));
