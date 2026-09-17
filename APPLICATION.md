# MindTrace AI — Application Overview

A mobile-first wellness app that passively monitors behavioral and mental-health
signals (sleep, mood, activity, stress) and surfaces them through an AI-driven
dashboard, trend charts, and personalized recommendations. Product personality:
**"The Quiet Observer"** — clinically precise, calming, non-intrusive.

Built from the Google Stitch design project *MindTrace AI Wellness System*
(`projects/16828359225812598247`); see [implementation-plan.md](implementation-plan.md)
for the original phased roadmap.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 57 (React Native 0.86, React 19) |
| Routing | Expo Router (file-based, typed routes) |
| Language | TypeScript |
| State | Zustand (`authStore`) + TanStack Query (`AppProviders`) |
| Backend | Vercel serverless (`api/`) + Neon Postgres (custom scrypt/session auth) |
| Local persistence | AsyncStorage (session token, theme) |
| Fonts / icons | Bundled Inter (`assets/fonts`), `@expo/vector-icons` (Feather) |
| Animation | React Native Reanimated + Worklets |
| Charts | (trends screen — see `src/hooks/useTrends.ts`) |
| Native extension | Custom Expo module `android-wellbeing` (Android only) |

## Platforms

- **Web** — `npx expo start --web` / `npx expo export --platform web`. Runs entirely
  through Metro's web bundler; no native modules required.
- **Android** — requires a custom **development build** (`npx expo run:android`)
  rather than Expo Go, because the project ships a custom native module
  (`modules/android-wellbeing`). Application id: `com.mindtraceai.app`.
- **iOS** — scaffolded (`ios: { supportsTablet: true }` in `app.json`) but not
  the focus of current work; would also need a dev client for native modules.

## App structure

```
app/                      Expo Router screens (file-based routing)
  index.tsx               Splash → routes to onboarding/auth/tabs based on auth state
  (onboarding)/privacy    Privacy consent gate (must accept before account creation)
  (auth)/login,signup     Email/password auth (local + Supabase-backed)
  (tabs)/                 Main authenticated app (bottom tab navigator)
    dashboard             Behavioral wellness widgets (mood, sleep, activity, stress)
    trends                7 / 30 / 90-day analytics charts
    recommendations       AI-generated wellness suggestions
    exercises             Guided wellness exercises
    breath                Breathing exercise screen
    profile               Account, settings, theme, data export
  ai-insights.tsx         Deep-dive AI insight screen
  perfect-plan.tsx        Personalized plan screen
  modal.tsx               Metric detail modal
  _layout.tsx             Root stack: fonts, theming, auth hydration, realtime sync

src/
  components/             UI building blocks, dashboard widgets, charts
  hooks/                  useExercises, useRecommendations, useTrends,
                          useWellnessSummary, useRealtimeSync, useTheme
  providers/              AppProviders — wraps app in TanStack QueryClientProvider
  services/
    supabase.ts           Supabase client (auth + AsyncStorage session storage)
    auth.ts               Sign in/up/out, settings, current-user lookup
    wellness.ts           Wellness snapshots: fetch/seed from Supabase, summary stats
    recommendations.ts    Rule-based AI recommendation generation
    exercises.ts          Exercise catalogue
    realAnalytics.ts      Real device analytics aggregation
    simulator.ts          Mock/simulated wellness data generator
    storage.ts            AsyncStorage helpers
  stores/
    authStore.ts          Zustand store: user, theme, auth actions, hydration,
                          bootstraps wellness snapshots + recommendations on login
  theme/                  Design tokens (colors, spacing, typography) from Stitch
  types/wellness.ts       Domain types: WellnessSnapshot, Summary, Recommendation,
                          UserProfile, UserSettings, Exercise, RiskLevel

modules/android-wellbeing/  Custom Expo native module (Android only)
                            Exposes: hasUsageStatsPermission, requestUsageStatsPermission,
                            getSystemWellbeingMetrics → { screenTimeMinutes, unlockCount,
                            sleepHours } via Android UsageStatsManager. No-ops on other
                            platforms (returns zeros / false).
```

## Core user flow

1. **Splash** (`app/index.tsx`) — checks hydrated auth state, routes accordingly.
2. **Onboard** — privacy consent gate → account creation (login/signup).
3. **Monitor** — Behavioral Dashboard shows live wellness widgets.
4. **Analyze** — Trends screen renders 7/30/90-day charts (mood, sleep, activity, stress, risk).
5. **Act** — AI Recommendations (currently rule-based, generated in
   `src/services/recommendations.ts` and bootstrapped on login via `authStore.bootstrapUserData`).
6. **Manage** — Profile: display name, theme (light/dark), notifications,
   data sharing, sign-out.

## Data & domain model (`src/types/wellness.ts`)

- `WellnessSnapshot` — point-in-time record: mood/sleep/activity/stress scores + `RiskLevel`.
- `WellnessSummary` — aggregated current state with trend deltas (`moodTrend`, etc.).
- `Recommendation` — AI suggestion with category (`sleep | mindfulness | activity | general`),
  priority, dismissed/completed flags.
- `UserProfile` / `UserSettings` — account + preferences (theme, notifications, data sharing).
- `Exercise` — guided exercise with steps and duration.

`ensureSnapshots()` (in `wellness.ts`) seeds a single zero-baseline snapshot for new
users in Supabase rather than generating fake history.

## Auth & sync

- `authStore` (Zustand) drives the whole app's auth lifecycle: hydration on launch,
  sign in/up/out, privacy consent, onboarding completion, theme persistence.
  Sessions are opaque tokens (SHA-256 hashed in Neon), stored in AsyncStorage.
- Backend is Vercel serverless (`api/`) + Neon Postgres — no client-side DB keys.
  OpenAI keys stay server-side (`/api/chat`, `/api/doctor-chat`, recommendation generation).
- `useRealtimeSync` (used in the root layout) polls dashboard queries every 60s
  while the app is foregrounded.

## Theming

Design tokens live in `src/theme/` (colors, spacing, typography), sourced from the
Stitch design system. The app supports light/dark themes, persisted per-user via
`UserSettings.theme` and applied through `useTheme()` + Expo Router's `ThemeProvider`.

## Known platform constraint

Because of the custom `android-wellbeing` native module, the app **cannot run inside
Expo Go** — Android testing requires building a development client with
`npx expo run:android`. Web has no such constraint and runs purely through Metro's
web bundler. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for build/runtime issues
encountered and how they were resolved.

## Environment

Configuration is loaded from `.env` (see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY`
- `STITCH_PROJECT_ID`
