# MindTrace AI Wellness System — Implementation Plan

> **Source of truth (design):** Google Stitch project `MindTrace AI Wellness System`  
> **Stitch project ID:** `projects/16828359225812598247`  
> **Local repo:** `MCPSTICH` (currently empty — greenfield build)

---

## 1. Project Summary

**MindTrace AI** is a mobile-first wellness application that passively monitors behavioral and mental-health signals and surfaces insights through an AI-powered dashboard. The product personality is **"The Quiet Observer"** — clinically precise, calming, and non-intrusive.

### Core user flows

1. **Onboard** → Privacy consent → Account creation
2. **Monitor** → Behavioral dashboard with real-time wellness widgets
3. **Analyze** → Trends over time (sleep, mood, activity, risk)
4. **Act** → AI-generated recommendations
5. **Manage** → Profile, settings, data export, notifications

### Stitch screens (implementation order)

| # | Screen | Stitch ID | Priority |
|---|--------|-----------|----------|
| 1 | Splash Screen | `d19acf18c03746708ec3fc350a696eb4` | P0 |
| 2 | Privacy Onboarding | `fb488f3ea05a4ceb8556aad47534dfa8` | P0 |
| 3 | Login / Signup | `6df3ff1af572457f9ea5a320a5f24c9c` | P0 |
| 4 | Behavioral Dashboard | `6da5e3ebf38f4c10a31fab79536de657` | P0 |
| 5 | Behavioral Dashboard (Interactive) | `da8e766bd1d24a73b88415c1da67aadc` | P1 |
| 6 | Trends Analytics | `732a28f447254249917f91fa76fc83fb` | P1 |
| 7 | AI Recommendations | `e7057a9e626040e8bf3455b8d31ea318` | P1 |
| 8 | Profile & Settings | `7001422a03b74ff0801a29b69c847f70` | P1 |
| 9 | Animated variants | `3489e4d130034280bb2d7d21ec6d5832`, `6f14431162e147ae81482bf5f1f737b1` | P2 |
| 10 | Logo asset | `66c31759807c4487be50fc0160e379af` | P2 |

---

## 2. Recommended Tech Stack

### Option A — React Native + Expo (recommended for mobile-first)

Best match for Stitch mobile designs (390–780px) and fastest path to iOS + Android.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Expo (SDK 52+)** | OTA updates, native modules, fast dev loop |
| Language | **TypeScript** | Type safety for health data models |
| Navigation | **Expo Router** | File-based routing, deep links |
| Styling | **NativeWind (Tailwind)** | Maps cleanly to Stitch design tokens |
| State | **Zustand** + **TanStack Query** | Lightweight global state + server cache |
| Charts | **Victory Native** or **react-native-gifted-charts** | Glow-line trend charts |
| Auth | **Supabase Auth** or **Firebase Auth** | Email, OAuth, session management |
| Backend | **Supabase** (Postgres + Edge Functions) | Realtime, RLS, fast MVP |
| AI | **OpenAI API** or **Gemini API** | Recommendation engine |
| Animations | **React Native Reanimated** | Splash + dashboard micro-interactions |

### Option B — Next.js PWA (web-first, mobile-responsive)

Use if you want a single web codebase with optional install-as-app.

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Charts | Recharts or Chart.js |
| Backend | Same as Option A |

### Option C — Flutter

Use if team is Dart-native or needs pixel-perfect custom rendering.

---

**Decision needed before Phase 1:** Pick Option A, B, or C. This plan assumes **Option A (Expo)** unless you choose otherwise.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Onboard  │ │ Dashboard│ │ Trends   │ │ AI Recs      │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       └────────────┴────────────┴──────────────┘            │
│                         │                                    │
│              ┌──────────▼──────────┐                        │
│              │  API Client Layer     │                        │
│              │  (TanStack Query)     │                        │
│              └──────────┬──────────┘                        │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                    Backend (Supabase)                        │
│  ┌──────────┐ ┌──────────────┐ ┌────────────────────────┐   │
│  │ Auth     │ │ Postgres DB  │ │ Edge Functions         │   │
│  │          │ │ + RLS        │ │ (AI, aggregation)      │   │
│  └──────────┘ └──────────────┘ └────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │  External AI Provider   │
              │  (recommendations)      │
              └─────────────────────────┘
```

### Key principles

- **Privacy-first:** Collect minimum metadata; encrypt at rest; explicit consent gates.
- **Offline-tolerant:** Cache last-known dashboard state; sync when online.
- **Modular widgets:** Dashboard composed of independent analytics cards (matches Stitch fluid grid).
- **Design-system driven:** All UI tokens from a single theme file — never hardcode colors in screens.

---

## 4. Design System Implementation

Translate the Stitch **MindTrace AI Design System** into code before building screens.

### 4.1 Color tokens

Create `src/theme/colors.ts`:

```ts
export const colors = {
  background: '#111318',
  surface: '#1e2024',
  surfaceContainer: '#282a2e',
  primary: '#ddb7ff',        // Electric Purple
  primaryAccent: '#a855f7',
  secondary: '#4cd7f6',      // Cyan
  tertiary: '#4edea3',     // Emerald (healthy/low-risk)
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#cfc2d6',
  outline: '#988d9f',
  error: '#ffb4ab',
  // Semantic
  riskLow: '#4edea3',
  riskMedium: '#4cd7f6',
  riskHigh: '#ffb4ab',
} as const;
```

### 4.2 Typography

| Token | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| `display-lg` | Inter | 48px | 700 | Hero headings |
| `headline-lg-mobile` | Inter | 24px | 600 | Screen titles |
| `title-md` | Inter | 20px | 600 | Card titles |
| `body-md` | Inter | 16px | 400 | Body copy |
| `label-caps` | Inter | 12px | 700 | Status chips |
| `data-mono` | JetBrains Mono | 14px | 500 | Metrics, timestamps |

Load fonts via `expo-font` in `app/_layout.tsx`.

### 4.3 Spacing & radius

```ts
export const spacing = { xs: 4, sm: 12, md: 24, lg: 40, xl: 64, gutter: 20, marginMobile: 16 };
export const radius = { sm: 4, md: 8, lg: 16, xl: 24, full: 9999 };
```

### 4.4 Core components (build first)

| Component | File | Notes |
|-----------|------|-------|
| `GlassCard` | `components/ui/GlassCard.tsx` | Blur + 1px accent border |
| `MetricWidget` | `components/dashboard/MetricWidget.tsx` | Title, icon, value, sparkline |
| `GlowLineChart` | `components/charts/GlowLineChart.tsx` | 2pt line + soft glow |
| `StatusChip` | `components/ui/StatusChip.tsx` | Pill badge (Active, Analyzing) |
| `PrimaryButton` | `components/ui/PrimaryButton.tsx` | Solid purple |
| `SecondaryButton` | `components/ui/SecondaryButton.tsx` | Cyan border |
| `InputField` | `components/ui/InputField.tsx` | Dark bg, glow on focus |
| `BottomNav` | `components/navigation/BottomNav.tsx` | Dashboard / Trends / AI / Profile |

### 4.5 Glassmorphism recipe

```tsx
// GlassCard base styles (NativeWind / StyleSheet)
backgroundColor: 'rgba(30, 32, 36, 0.6)',
borderWidth: 1,
borderColor: 'rgba(168, 85, 247, 0.15)', // purple at 15%
borderRadius: 16,
// Use expo-blur: <BlurView intensity={12} />
```

---

## 5. Data Model

### 5.1 Database schema (Supabase / Postgres)

```sql
-- users (extends Supabase auth.users)
profiles (
  id            uuid PK references auth.users,
  display_name  text,
  avatar_url    text,
  onboarding_complete boolean default false,
  privacy_consent_at  timestamptz,
  created_at    timestamptz
)

-- wellness snapshots (passive metadata)
wellness_snapshots (
  id            uuid PK,
  user_id       uuid FK,
  recorded_at   timestamptz,
  mood_score    float,          -- 0-100
  sleep_hours   float,
  activity_level float,         -- 0-100
  stress_index  float,          -- 0-100
  risk_level    text,           -- 'low' | 'medium' | 'high'
  metadata      jsonb            -- extensible trace data
)

-- AI recommendations
recommendations (
  id            uuid PK,
  user_id       uuid FK,
  title         text,
  body          text,
  category      text,           -- 'sleep' | 'mindfulness' | 'activity'
  priority      int,
  generated_at  timestamptz,
  dismissed     boolean default false
)

-- user settings
user_settings (
  user_id       uuid PK,
  notifications_enabled boolean,
  data_sharing_enabled  boolean,
  theme         text default 'dark'
)
```

### 5.2 TypeScript types

```ts
interface WellnessSnapshot {
  id: string;
  recordedAt: string;
  moodScore: number;
  sleepHours: number;
  activityLevel: number;
  stressIndex: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Recommendation {
  id: string;
  title: string;
  body: string;
  category: 'sleep' | 'mindfulness' | 'activity' | 'general';
  priority: number;
}
```

### 5.3 Mock data strategy (Phase 1–2)

Use `src/mocks/wellnessData.ts` with 30 days of synthetic snapshots so UI can be built before backend is live. Replace with API calls in Phase 3.

---

## 6. Screen Implementation Guide

### 6.1 Splash Screen

- **Route:** `app/index.tsx`
- **Behavior:** Show logo + tagline for 2s → check auth state → route to onboarding or dashboard
- **Assets:** Export logo from Stitch screen `66c31759807c4487be50fc0160e379af`
- **Animation (P2):** Fade-in logo, subtle pulse glow (Reanimated)

### 6.2 Privacy Onboarding

- **Route:** `app/(onboarding)/privacy.tsx`
- **Content:** What data is collected, how AI analyzes metadata, user rights
- **Actions:** Accept (stores `privacy_consent_at`) / Learn more
- **Gate:** Block app access until consent given

### 6.3 Login / Signup

- **Route:** `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`
- **Fields:** Email, password; optional OAuth (Google, Apple)
- **Validation:** Zod schemas
- **Post-auth:** Redirect to dashboard or onboarding if incomplete

### 6.4 Behavioral Dashboard (core screen)

- **Route:** `app/(tabs)/dashboard.tsx`
- **Layout:** Scrollable fluid widget grid
- **Widgets to implement:**
  - Overall wellness score (hero metric)
  - Mood trend (sparkline, purple)
  - Sleep quality (cyan)
  - Activity level (cyan)
  - Stress index (purple/amber)
  - Risk indicator chip (emerald / cyan / red)
  - "Last updated" timestamp (JetBrains Mono)
- **Data source:** `useWellnessSummary()` hook → mock then API
- **Interactive variant (P1):** Tap widget → expand to detail sheet

### 6.5 Trends Analytics

- **Route:** `app/(tabs)/trends.tsx`
- **Charts:** 7-day / 30-day / 90-day toggle
- **Metrics:** Mood, sleep, activity, stress (multi-line glow chart)
- **Components:** `GlowLineChart`, date range picker, legend

### 6.6 AI Recommendations

- **Route:** `app/(tabs)/recommendations.tsx`
- **UI:** Card list sorted by priority
- **Backend:** Edge Function calls AI with user snapshot summary → returns 3–5 recs
- **Actions:** Dismiss, mark done, save for later

### 6.7 Profile & Settings

- **Route:** `app/(tabs)/profile.tsx`
- **Sections:** Account info, notification toggles, data export, privacy policy, logout, delete account

---

## 7. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/wellness/summary` | Dashboard aggregate |
| GET | `/api/wellness/snapshots?range=7d` | Trend data |
| POST | `/api/wellness/snapshots` | Ingest new snapshot |
| GET | `/api/recommendations` | List active recs |
| POST | `/api/recommendations/generate` | Trigger AI generation |
| PATCH | `/api/recommendations/:id` | Dismiss / complete |
| GET/PATCH | `/api/profile` | User profile |
| GET/PATCH | `/api/settings` | User preferences |

Implement as **Supabase Edge Functions** or **Next.js API routes** depending on stack choice.

---

## 8. Stitch → Code Workflow

For each screen, follow this pipeline:

1. **Fetch screen** via Stitch MCP `get_screen` with screen `name` path
2. **Download** `htmlCode.downloadUrl` and `screenshot.downloadUrl`
3. **Review** HTML structure for component boundaries (do not copy-paste HTML into RN — translate to components)
4. **Map** Tailwind classes in HTML → NativeWind / theme tokens
5. **Verify** against screenshot pixel-by-pixel in simulator
6. **Commit** screen + link to Stitch ID in PR description

### Stitch MCP commands (reference)

```bash
# List screens
tools/call → list_projects
tools/call → list_screens (project name)

# Get screen HTML + screenshot
tools/call → get_screen
  arguments: { "name": "projects/16828359225812598247/screens/<SCREEN_ID>" }
```

---

## 9. Project Structure

```
MCPSTICH/
├── app/                          # Expo Router screens
│   ├── _layout.tsx
│   ├── index.tsx                 # Splash
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (onboarding)/
│   │   └── privacy.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── trends.tsx
│       ├── recommendations.tsx
│       └── profile.tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── charts/
│   │   └── navigation/
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── hooks/
│   │   ├── useWellnessSummary.ts
│   │   └── useRecommendations.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── supabase.ts
│   ├── mocks/
│   │   └── wellnessData.ts
│   └── types/
│       └── wellness.ts
├── assets/
│   ├── logo.png
│   └── fonts/
├── supabase/
│   ├── migrations/
│   └── functions/
├── implementation-plan.md        # this file
├── package.json
├── tailwind.config.js
├── app.json
└── .env.example
```

---

## 10. Implementation Phases

### Phase 0 — Setup (Week 1)

- [ ] Choose stack (Expo recommended)
- [ ] `npx create-expo-app@latest mindtrace --template tabs`
- [ ] Configure TypeScript, NativeWind, Expo Router
- [ ] Add Inter + JetBrains Mono fonts
- [ ] Create theme tokens from Stitch design system
- [ ] Set up `.env.example` (Supabase URL, anon key, AI API key)
- [ ] Initialize git repo

**Exit criteria:** App runs on simulator with themed blank screens.

---

### Phase 1 — Design System + Navigation (Week 2)

- [ ] Build all core UI components (GlassCard, buttons, inputs, StatusChip)
- [ ] Build BottomNav with 4 tabs
- [ ] Implement Splash → auth routing skeleton
- [ ] Export Stitch logo asset into `assets/`

**Exit criteria:** Navigate between placeholder tab screens with correct theme.

---

### Phase 2 — Onboarding + Auth (Week 3)

- [ ] Privacy Onboarding screen (match Stitch)
- [ ] Login / Signup screens (match Stitch)
- [ ] Integrate Supabase Auth
- [ ] Persist onboarding + consent state
- [ ] Protected route guard

**Exit criteria:** New user can sign up, accept privacy, land on empty dashboard.

---

### Phase 3 — Dashboard + Mock Data (Week 4–5)

- [ ] Create mock wellness dataset (30 days)
- [ ] Build MetricWidget + dashboard grid
- [ ] Implement all dashboard widgets
- [ ] Risk level chip with semantic colors
- [ ] Pull-to-refresh

**Exit criteria:** Dashboard fully functional with mock data, matches Stitch screenshot.

---

### Phase 4 — Trends + Charts (Week 6)

- [ ] GlowLineChart component
- [ ] Trends Analytics screen
- [ ] Date range selector (7d / 30d / 90d)
- [ ] Interactive dashboard drill-down (P1)

**Exit criteria:** Trends screen renders multi-metric charts from mock data.

---

### Phase 5 — Backend + Real Data (Week 7–8)

- [ ] Supabase schema + RLS policies
- [ ] API client layer (TanStack Query)
- [ ] Replace mocks with live API
- [ ] Snapshot ingestion endpoint (manual or simulated sensor feed)

**Exit criteria:** Dashboard and trends load from database.

---

### Phase 6 — AI Recommendations (Week 9)

- [ ] Edge Function: summarize user data → prompt AI → parse recs
- [ ] Recommendations screen UI
- [ ] Dismiss / complete actions
- [ ] Rate-limit AI calls (1x per day per user)

**Exit criteria:** User sees personalized recommendations generated from their data.

---

### Phase 7 — Profile, Polish, Ship (Week 10–11)

- [ ] Profile & Settings screen
- [ ] Splash + Trends animations (P2)
- [ ] Error states, empty states, loading skeletons
- [ ] Accessibility (contrast, screen reader labels)
- [ ] EAS Build for iOS + Android test builds

**Exit criteria:** TestFlight / internal APK ready for beta.

---

### Phase 8 — Beta + Iterate (Week 12+)

- [ ] User testing feedback
- [ ] Performance profiling (long dashboard scroll)
- [ ] HIPAA-adjacent privacy review (if targeting healthcare)
- [ ] App Store / Play Store submission prep

---

## 11. Testing Strategy

| Type | Tool | Coverage |
|------|------|----------|
| Unit | Jest | Theme utils, data transforms, Zod validators |
| Component | React Native Testing Library | MetricWidget, GlassCard, charts |
| E2E | Maestro or Detox | Onboarding → login → dashboard flow |
| Visual | Stitch screenshot diff | Compare simulator screenshot vs Stitch export |
| API | Supabase local + pgTAP | RLS policies, edge functions |

### Critical test cases

- User cannot access dashboard without privacy consent
- RLS: user A cannot read user B's wellness data
- Dashboard renders correctly with 0 snapshots (empty state)
- AI recommendations handle API failure gracefully

---

## 12. Environment Variables

```env
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only
OPENAI_API_KEY=sk-...                              # or GEMINI_API_KEY
STITCH_PROJECT_ID=projects/16828359225812598247
```

Never commit real keys. Stitch API key stays in `~/.cursor/mcp.json` only.

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Health data privacy regulations | High | Consent gates, RLS, minimal collection, legal review |
| Stitch HTML ≠ RN components | Medium | Translate designs manually; use screenshots as reference |
| AI recommendation quality | Medium | Constrain prompts, human-review in beta, disclaimer UI |
| Chart performance on low-end devices | Medium | Limit data points, use `react-native-skia` if needed |
| Scope creep (animated variants early) | Low | Defer P2 animations until core flows ship |

---

## 14. Success Metrics (MVP)

- [ ] 5 core screens implemented and visually aligned with Stitch
- [ ] Auth + privacy flow complete
- [ ] Dashboard loads in < 2s on mid-range device
- [ ] 30-day trend charts render smoothly
- [ ] AI generates ≥ 3 relevant recommendations per user
- [ ] Beta build installable on iOS + Android

---

## 15. Next Immediate Actions

1. **Confirm tech stack** — Reply with Expo, Next.js, or Flutter
2. **Scaffold project** — Run `create-expo-app` in `MCPSTICH`
3. **Export assets** — Pull logo + screen HTML from Stitch via MCP
4. **Start Phase 0** — Theme tokens + font setup
5. **Create Supabase project** — Enable Auth + Postgres

---

## Appendix A — Stitch Design System Reference

- **Color mode:** Dark
- **Primary:** Electric Purple `#a855f7` / `#ddb7ff`
- **Secondary:** Cyan `#06b6d4` / `#4cd7f6`
- **Tertiary:** Emerald `#10b981` / `#4edea3`
- **Background:** `#111318` (surface), `#0a0c10` (deepest)
- **Font:** Inter (UI), JetBrains Mono (data)
- **Roundness:** 8px base (`ROUND_EIGHT`)
- **Style:** Glassmorphism, glow charts, fluid widget grid

## Appendix B — Screen Stitch Paths

```
projects/16828359225812598247/screens/d19acf18c03746708ec3fc350a696eb4   # Splash
projects/16828359225812598247/screens/fb488f3ea05a4ceb8556aad47534dfa8   # Privacy
projects/16828359225812598247/screens/6df3ff1af572457f9ea5a320a5f24c9c   # Login
projects/16828359225812598247/screens/6da5e3ebf38f4c10a31fab79536de657   # Dashboard
projects/16828359225812598247/screens/da8e766bd1d24a73b88415c1da67aadc   # Dashboard Interactive
projects/16828359225812598247/screens/732a28f447254249917f91fa76fc83fb   # Trends
projects/16828359225812598247/screens/e7057a9e626040e8bf3455b8d31ea318   # AI Recs
projects/16828359225812598247/screens/7001422a03b74ff0801a29b69c847f70   # Profile
```

---

*Generated from Stitch project analysis — June 6, 2026*
