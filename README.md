# MindTrace AI Wellness System

Mobile wellness app built from the Google Stitch **MindTrace AI Wellness System** designs.

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

## Demo account

On the login screen, tap **Try Demo Account** or sign in with:

- Email: `demo@mindtrace.ai`
- Password: `demo1234`

## Project structure

- `app/` — Expo Router screens
- `src/theme/` — Stitch design tokens
- `src/components/` — UI, dashboard, charts
- `src/services/` — Auth, wellness, recommendations
- `src/stores/` — Zustand auth store
- `implementation-plan.md` — Full phased roadmap

## Next steps (from plan)

1. Connect Supabase for cloud auth and sync
2. Replace rule-based AI with OpenAI / Gemini Edge Function
3. Export Stitch HTML assets for pixel-perfect polish
4. EAS Build for iOS / Android distribution
