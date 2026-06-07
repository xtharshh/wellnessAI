# AI Suggestions Persistence Implementation Guide

## Overview
This implementation allows AI-suggested items (music, exercises, etc.) to be **stored and reused** rather than generated fresh each time. Users can ask the chatbot for music suggestions, and those suggestions will appear in the Recommendations tab with clickable links.

## Changes Made

### 1. **New Supabase Table: `lifestyle_items`**
   - Location: Run SQL from `SETUP_LIFESTYLE_ITEMS_TABLE.sql`
   - Purpose: Persists AI-suggested books, movies, songs, podcasts, meditations, and productivity items
   - Fields: id, user_id, title, creator, category, description, reason, image_url, link_url, custom, created_at
   - RLS Policies: Users can only view/insert/delete their own items

### 2. **Persistence Functions in `src/services/recommendations.ts`**
   - `mapDbLifestyleRowToItem(row)` — Maps database rows to `LifestyleItem` objects
   - `getSavedLifestyleItems(userId)` — Fetches user's persisted lifestyle items from the database
   - `saveAISuggestedLifestyleItems(userId, items)` — Dedupes and persists new lifestyle items (mirrors `saveAISuggestedExercises` pattern)
   - `getLifestyleRecommendations(userId)` — **Updated**: Now merges saved items with generated recommendations, avoiding duplicates

### 3. **Music Suggestion System in `src/services/chatbot.ts`**
   - `MUSIC_SUGGESTIONS` array — 5 curated songs with title, creator, description, and working YouTube links
   - `music_request` keyword category — Detects phrases like "suggest music", "recommend a song", "play something"
   - `sendChatMessage(message, history, userId)` — **Updated**: 
     - Now accepts `userId` parameter
     - Detects music requests before general category matching
     - Picks a random song from `MUSIC_SUGGESTIONS`
     - Persists it via `saveAISuggestedLifestyleItems`
     - Replies with song name, artist, description, and a direct link to the Music tab

### 4. **Chat Screen Integration in `app/(tabs)/chat.tsx`**
   - **Updated**: Passes `user.id` to `sendChatMessage()` so userId is available for persistence

## Setup Instructions

### Step 1: Create the Supabase Table
1. Go to your Supabase project dashboard
2. Open the **SQL Editor**
3. Copy and paste the contents of `SETUP_LIFESTYLE_ITEMS_TABLE.sql`
4. Click **Run**
5. Verify the table appears in your **Tables** list

### Step 2: Verify Code Changes
All code changes are already implemented:
- ✅ `src/services/recommendations.ts` — Persistence functions added
- ✅ `src/services/chatbot.ts` — Music suggestions and userId threading added
- ✅ `app/(tabs)/chat.tsx` — userId passed to sendChatMessage

### Step 3: Test the Feature

#### Test Music Suggestions:
1. Start the app: `npx expo start`
2. Sign in with a test account
3. Go to the **Chat** tab
4. Type one of these phrases:
   - "suggest some music"
   - "recommend a song"
   - "what should i listen to"
   - "play something for me"
5. Confirm:
   - The bot replies with a specific song name, artist, and description
   - A clickable link to the song is included
   - No errors in the console

#### Test Persistence:
1. After the bot suggests a song, go to **Recommendations** tab
2. Select **For You** > **Lifestyle** > **Music**
3. Confirm the suggested song appears as a card with:
   - Title (e.g., "Weightless")
   - Creator (e.g., "Marconi Union")
   - Description
   - A **Music** category badge
4. Tap the card and verify the link opens in your browser

#### Test Deduplication:
1. Ask for music suggestions multiple times
2. Check Supabase table (`lifestyle_items`) — confirm:
   - No duplicate rows (same song from multiple requests creates only one entry)
   - Each entry has `custom: true` and `user_id` set correctly

#### Test No Regressions:
1. Confirm existing features still work:
   - **Exercises**: Chatbot exercise suggestions still appear in the Exercises library
   - **Other Recommendations**: Books, movies, podcasts, meditations still display correctly in the Recommendations tab
   - **Breathing Timer, Journal, Dashboard** — all other features unaffected

## How It Works

### Music Request Flow:
```
User: "suggest some music"
  ↓
Chat Screen sends message + user.id to sendChatMessage()
  ↓
Chatbot detects "music_request" keyword
  ↓
Randomly picks a song from MUSIC_SUGGESTIONS
  ↓
Calls saveAISuggestedLifestyleItems(userId, [songItem])
  ↓
Function dedupes (checks if song already exists for this user)
  ↓
If new: inserts into lifestyle_items table (custom: true)
  ↓
Bot replies with song name, artist, link
  ↓
User navigates to Recommendations → Music
  ↓
Music tab fetches getLifestyleRecommendations()
  ↓
Function merges saved lifestyle_items + generated recommendations
  ↓
Song card appears with title, creator, description, clickable link
```

### Deduplication Logic:
- **Key**: `title.toLowerCase().trim() + category`
- **Where**: In `saveAISuggestedLifestyleItems()`, checks existing items before insert
- **Benefit**: Same song suggested multiple times won't create duplicates

## Extending to Other Categories

To add similar persistence for other content types (e.g., "suggest a book" or "recommend a podcast"):

1. Add keywords to `KEYWORDS.music_request` or create a new category
2. Create a `BOOK_SUGGESTIONS` or `PODCAST_SUGGESTIONS` array in `chatbot.ts`
3. Add detection logic in `sendChatMessage()` similar to the music request handler
4. Call `saveAISuggestedLifestyleItems()` with the suggested item

The UI (Recommendations screen) will automatically display any persisted `LifestyleItem`, so no frontend changes needed.

## File Summary

| File | Changes |
|------|---------|
| `SETUP_LIFESTYLE_ITEMS_TABLE.sql` | **New** — SQL to create `lifestyle_items` table |
| `src/services/recommendations.ts` | Added 3 functions: `mapDbLifestyleRowToItem`, `getSavedLifestyleItems`, `saveAISuggestedLifestyleItems` + updated `getLifestyleRecommendations` |
| `src/services/chatbot.ts` | Added `MUSIC_SUGGESTIONS` array, `MusicSuggestion` interface, `music_request` keywords, music detection + persistence in `sendChatMessage` |
| `app/(tabs)/chat.tsx` | Updated `sendChatMessage()` call to pass `user?.id` |

## Troubleshooting

**Issue**: Music suggestions not appearing in Recommendations tab
- **Solution**: Ensure `SETUP_LIFESTYLE_ITEMS_TABLE.sql` was run in Supabase. Check table exists and has RLS enabled.

**Issue**: "Failed to save AI-suggested lifestyle items" in console
- **Solution**: Check Supabase RLS policies — user must be authenticated. Verify `user_id` is being passed correctly from chat screen.

**Issue**: Music suggestion link doesn't open
- **Solution**: Verify `linkUrl` in `MUSIC_SUGGESTIONS` is a valid, working URL. Test the URL in a browser first.

**Issue**: Duplicates appearing in Recommendations
- **Solution**: The deduplication logic should prevent this. Check that `saveAISuggestedLifestyleItems()` is being called with the correct `userId` and item structure.
