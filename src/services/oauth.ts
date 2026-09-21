import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';

import { apiFetch, setToken } from '@/src/services/apiClient';
import type { UserProfile } from '@/src/types/wellness';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

// Client IDs are platform-specific in Google Cloud. In Expo Go the redirect
// goes through the Expo proxy, so the WEB client ID is used everywhere there.
// Dev builds use the app scheme — configure Android/iOS OAuth clients for those.
function googleClientId(): string {
  // Static accesses only — Metro inlines EXPO_PUBLIC_* at bundle time.
  const base = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  const android = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '').trim();
  const ios = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '').trim();
  const web = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '').trim();
  const specific = Platform.OS === 'android' ? android : Platform.OS === 'ios' ? ios : web;
  const id = specific || base;
  if (!id) {
    throw new Error(
      'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID (Google Cloud → Credentials → OAuth Web client) to .env.'
    );
  }
  return id;
}

export function googleRedirectUri(): string {
  return AuthSession.makeRedirectUri();
}

interface OAuthResponse {
  token: string;
  user: UserProfile;
}

export async function signInWithGoogleIdToken(idToken: string): Promise<UserProfile> {
  const data = await apiFetch<OAuthResponse>('/api/auth/oauth', {
    method: 'POST',
    auth: false,
    body: { provider: 'google', idToken },
  });
  await setToken(data.token);
  return data.user;
}

/**
 * Google sign-in hook for buttons. Handles auth session → code exchange →
 * server verify → session token. Caller finishes login via onSuccess.
 */
export function useGoogleSignIn(onSuccess: (user: UserProfile) => Promise<void> | void) {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: (() => {
        try {
          return googleClientId();
        } catch {
          return 'GOOGLE_CLIENT_ID_MISSING';
        }
      })(),
      scopes: ['openid', 'profile', 'email'],
      redirectUri: googleRedirectUri(),
    },
    discovery
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (response?.type !== 'success') {
        if (response?.type === 'error') setError('Google sign-in was cancelled or failed.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { code } = response.params;
        const exchanged = await AuthSession.exchangeCodeAsync(
          {
            clientId: googleClientId(),
            code,
            redirectUri: googleRedirectUri(),
            extraParams: request?.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : undefined,
          },
          discovery
        );
        const idToken = (exchanged as any)?.idToken;
        if (!idToken) throw new Error('Google did not return an identity token.');
        const user = await signInWithGoogleIdToken(idToken);
        await onSuccess(user);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Google sign-in failed.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const signIn = async () => {
    setError(null);
    try {
      googleClientId();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in is not configured.');
      return;
    }
    await promptAsync();
  };

  return { signIn, loading, error, clearError: () => setError(null) };
}
