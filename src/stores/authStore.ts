import { create } from 'zustand';

import * as authService from '@/src/services/auth';
import * as recommendationsService from '@/src/services/recommendations';
import { ensureSnapshots } from '@/src/services/wellness';
import { UserProfile } from '@/src/types/wellness';

interface AuthState {
  user: UserProfile | null;
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
  clearError: () => void;
}

async function bootstrapUserData(userId: string) {
  await ensureSnapshots(userId);
  await recommendationsService.generateRecommendations(userId);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  loading: false,
  error: null,

  hydrate: async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      await bootstrapUserData(user.id);
    }
    set({ user, hydrated: true });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      await bootstrapUserData(user.id);
      set({ user, loading: false });
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
      set({ user, loading: false });
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
    set({ user: null });
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

  clearError: () => set({ error: null }),
}));
