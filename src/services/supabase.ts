import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

const memoryStore = new Map<string, string>();

const fallbackStorage = {
  getItem: async (key: string) => {
    return memoryStore.has(key) ? memoryStore.get(key) ?? null : null;
  },
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
};

const webStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const value = window.localStorage.getItem(key);
    return value === null ? null : value;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  },
};

const createAuthStorage = () => {
  if (Platform.OS === 'web') {
    return webStorage;
  }

  if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
    return {
      getItem: async (key: string) => {
        try {
          return await AsyncStorage.getItem(key);
        } catch {
          return memoryStore.has(key) ? memoryStore.get(key) ?? null : null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch {
          memoryStore.set(key, value);
        }
      },
      removeItem: async (key: string) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch {
          memoryStore.delete(key);
        }
      },
    };
  }

  return fallbackStorage;
};

// Safely resolve the WebSocket constructor across all target platforms (Web, Android, iOS, SSR, and Node.js)
const getWebSocketConstructor = () => {
  if (typeof globalThis.WebSocket !== 'undefined') {
    return globalThis.WebSocket;
  }
  if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
    return window.WebSocket;
  }
  try {
    // Dynamic import to prevent bundler errors on Web/Mobile
    const wsModule = typeof require !== 'undefined' ? require('ws') : null;
    return wsModule || undefined;
  } catch {
    return undefined;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: getWebSocketConstructor(),
  }
});
