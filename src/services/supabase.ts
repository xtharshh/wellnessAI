import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

// Polyfill WebSocket in Node.js environment if it's missing (Node.js < 22)
if (typeof globalThis.WebSocket === 'undefined' && typeof window === 'undefined') {
  try {
    globalThis.WebSocket = require('ws');
  } catch (e) {
    console.warn('ws package is required for Supabase Realtime in Node.js < 22');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
