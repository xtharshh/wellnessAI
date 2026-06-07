# Troubleshooting Notes

Issues found and fixed while getting the project running on Web and Android (2026-06-07).

## 1. `Cannot find module 'expo/config-plugins'`

**Cause:** [package.json](package.json) pinned `"expo": "^46.0.21"` while every other Expo package
(`expo-router`, `expo-constants`, etc.) was on the SDK 56 line. Expo 46 predates the
`expo/config-plugins` subpath export that `expo-router`'s config plugin requires.

**Fix:** Bumped `expo` to `^56.0.9` and ran `npm install`, then `npx expo install --fix` to align
the remaining mismatched packages (`@react-native-async-storage/async-storage`, `expo-router`,
`expo-splash-screen`, `expo-symbols`, `react-native-svg`).

## 2. `Required property 'android.package' is not found in app.json`

**Cause:** [app.json](app.json) had no Android application id, which Expo requires to build/run
on Android.

**Fix:** Added `"package": "com.mindtraceai.app"` under `expo.android` in `app.json`.
This is a permanent app identity (Play Store), so it shouldn't be changed casually later.

## 3. "Something went wrong" screen in Expo Go

**Cause:** Not a bug — the project includes a custom native module
(`modules/android-wellbeing`), which Expo Go cannot run. Expo Go shows this generic error
whenever it can't load an incompatible project.

**Fix:** Build and install a custom development client via `npx expo run:android` instead of
using Expo Go.

## 4. Gradle build failure: `CXX1400 ... CMakeLists.txt but that file doesn't exist`

**Cause:** `node_modules/react-native-worklets/android/CMakeLists.txt` was missing — a corrupted/
incomplete local npm install (the file exists in the published npm tarball).

**Fix:** `rm -rf node_modules/react-native-worklets && npm install react-native-worklets@0.8.3 --no-save`

## 5. Gradle build failure: `ninja: error: failed recompaction: Permission denied`

**Cause:** Stale/locked native-build cache from a previous interrupted Gradle run
(`android/app/.cxx`), often combined with lingering Gradle daemons or AV file locks on Windows.

**Fix:**
```
cd android && ./gradlew.bat --stop      # stop Gradle daemons
# kill any stray java.exe / ninja.exe processes
rm -rf android/app/.cxx                  # clear the corrupted native-build cache
npx expo run:android                     # rebuild clean
```

## 6. Metro bundling error: `Unable to resolve module stream from .../ws/lib/stream.js`

**Cause:** [src/services/supabase.ts](src/services/supabase.ts) had a Node.js `WebSocket`
polyfill (`globalThis.WebSocket = require('ws')`) guarded by a runtime `if`. Metro statically
resolves every `require()` it finds regardless of runtime conditionals, and `ws` depends on
Node core modules (`stream`, `net`, ...) that don't exist in React Native's Hermes runtime.

**Fix:** Removed the polyfill block entirely — React Native always provides a native global
`WebSocket`, so the fallback was dead code on-device. Also removed the now-unused `ws`
dependency from `package.json` (`npm uninstall ws`).

This fix applies to both the Android and Web bundles since both go through Metro.

## 7. Debug APK stuck on the splash screen

**Cause:** [app/_layout.tsx](app/_layout.tsx) only calls `SplashScreen.hideAsync()` once
both `fontsLoaded` and `hydrated` (from `useAuthStore`) are `true`. But
[src/stores/authStore.ts](src/stores/authStore.ts) `hydrate()` had no error handling —
if `authService.getCurrentUser()` (a Supabase `getSession()` + `profiles` query) or
`bootstrapUserData()` threw or simply never resolved (a known class of issue where
`supabase-js`'s `getSession()`/`getUser()` can hang indefinitely in React Native due to
internal lock/storage edge cases on cold start), `set({ hydrated: true })` was never
reached — `hydrated` stayed `false` forever and the splash screen never hid.

**Fix:**
- Wrapped the body of `hydrate()` in `try/catch` so any error falls back to a
  logged-out state and still sets `hydrated: true`.
- Added a `withTimeout()` helper (8s) around `authService.getCurrentUser()` so a
  hung network/storage call can't block hydration indefinitely — it now always
  resolves and the splash screen always dismisses.

## Verifying both platforms

- **Web:** `npx expo export --platform web` bundles cleanly (27 static routes, no resolution errors).
- **Android:** Requires a custom dev client build (`npx expo run:android`) because of the
  `android-wellbeing` native module — cannot run in Expo Go.
