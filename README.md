# Wellness AI — Your Personal Wellness Intelligence

Mobile wellness app built from the Google Stitch **MindTrace AI Wellness System** designs.

> [!NOTE]
> For a detailed, comprehensive system and architectural walkthrough of the codebase, data flow, telemetry calculations, and AI logic, check out the [MindTrace System Guide](file:///c:/Users/HP/.cursor/MCPSTICH/MINDTRACE_GUIDE.md).

## Features

- Splash screen with auth routing
- Privacy onboarding with consent gate
- Login / signup (local persistence via AsyncStorage)
- Behavioral dashboard with wellness widgets
- Trends analytics (7 / 30 / 90 day charts)
- AI recommendations (rule-based from wellness data)
- Profile & settings

## Quick start

```bash
npm install
npm run web
```
Other platforms:

```bash
npm run android
npm run ios
npm start
```

## Backend (Neon + Vercel)

Production backend is serverless: `api/` routes on Vercel + Neon Postgres.

1. Create a Neon project, then run the schema:
  `DATABASE_URL='<pooled-connection-string>' node scripts/migrate-neon.mjs`
  (or apply `NEON_SCHEMA.sql` in the Neon SQL editor).
2. `vercel link`, then add env vars in the Vercel dashboard:
  `NEON_DATABASE_URL` (pooled, server-only), `OPENAI_API_KEY` (server-only),
  `EXPO_PUBLIC_API_URL` (your deployment URL), optional `RESEND_API_KEY`.
3. `vercel --prod` — builds `npx expo export --platform web` (`dist/`) plus `api/` functions.

Local API dev: `vercel dev` (proxies `/api/*`), or set `EXPO_PUBLIC_API_URL` to the deployed URL.

## Project structure

- `app/` — Expo Router screens
- `src/theme/` — Stitch design tokens
- `src/components/` — UI, dashboard, charts
- `src/services/` — Auth, wellness, recommendations
- `src/stores/` — Zustand auth store
- `implementation-plan.md` — Full phased roadmap

## Next steps

1. Add clinicians to the Neon `doctors` table to populate the Counsellor directory
2. Set `RESEND_API_KEY` to enable forgot-password emails
3. EAS Build for iOS / Android distribution (dev builds required for the wellbeing module)
