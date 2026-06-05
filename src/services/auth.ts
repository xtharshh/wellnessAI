import { supabase } from '@/src/services/supabase';
import { UserProfile, UserSettings } from '@/src/types/wellness';

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) return null;

  return {
    id: profile.id,
    email: session.user.email ?? '',
    displayName: profile.display_name ?? '',
    passwordHash: '', // Not used with cloud auth
    privacyConsentAt: profile.privacy_consent_at,
    onboardingComplete: profile.onboarding_complete,
    createdAt: profile.created_at,
  };
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;
  if (!user) {
    throw new Error('Registration failed. Please try again.');
  }

  // The database trigger 'on_auth_user_created' will create the profile and settings.
  // We fetch the newly created profile, retrying if the trigger has a slight delay.
  let profile = null;
  for (let i = 0; i < 5; i++) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (p) {
      profile = p;
      break;
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: profile?.display_name ?? input.displayName,
    passwordHash: '',
    privacyConsentAt: profile?.privacy_consent_at ?? null,
    onboardingComplete: profile?.onboarding_complete ?? false,
    createdAt: profile?.created_at ?? new Date().toISOString(),
  };
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;
  if (!user) {
    throw new Error('Sign in failed.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found.');
  }

  return {
    id: profile.id,
    email: user.email ?? '',
    displayName: profile.display_name ?? '',
    passwordHash: '',
    privacyConsentAt: profile.privacy_consent_at,
    onboardingComplete: profile.onboarding_complete,
    createdAt: profile.created_at,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateUser(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
  const dbPatch: Record<string, any> = {};
  if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
  if (patch.onboardingComplete !== undefined) dbPatch.onboarding_complete = patch.onboardingComplete;
  if (patch.privacyConsentAt !== undefined) dbPatch.privacy_consent_at = patch.privacyConsentAt;

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(dbPatch)
    .eq('id', userId)
    .select()
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? 'Failed to update user profile.');
  }

  const { data: { session } } = await supabase.auth.getSession();

  return {
    id: profile.id,
    email: session?.user?.email ?? '',
    displayName: profile.display_name ?? '',
    passwordHash: '',
    privacyConsentAt: profile.privacy_consent_at,
    onboardingComplete: profile.onboarding_complete,
    createdAt: profile.created_at,
  };
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      notificationsEnabled: true,
      dataSharingEnabled: false,
      theme: 'dark',
    };
  }

  return {
    notificationsEnabled: data.notifications_enabled,
    dataSharingEnabled: data.data_sharing_enabled,
    theme: data.theme as 'dark',
  };
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      notifications_enabled: settings.notificationsEnabled,
      data_sharing_enabled: settings.dataSharingEnabled,
      theme: settings.theme,
    });

  if (error) {
    throw new Error(error.message);
  }
}
