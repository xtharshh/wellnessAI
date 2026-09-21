import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { HttpError, readJson, route } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';

const schema = z.object({
  // Base64-encoded audio (m4a/mp3/wav). Capped well under Whisper's 25MB.
  audioBase64: z.string().min(1000).max(20_000_000),
  mimeType: z.string().max(80).default('audio/m4a'),
});

// Voice journal transcription (Whisper). Server key stays server-side.
// Mood/tags are suggested client-side from the transcript + user-reviewed
// before anything is saved — AI never files anything away silently.
export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  await requireUser(req);
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid audio. Record up to ~2 minutes.');
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'Voice transcription is not configured', fallback: 'type' });
    return;
  }

  const bytes = Buffer.from(parsed.data.audioBase64, 'base64');
  if (bytes.length > 18 * 1024 * 1024) {
    throw new HttpError(413, 'Recording is too long. Keep it under ~2 minutes.');
  }
  const ext = parsed.data.mimeType.includes('wav') ? 'wav' : parsed.data.mimeType.includes('mpeg') ? 'mp3' : 'm4a';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: parsed.data.mimeType }), `journal.${ext}`);
  form.append('model', 'gpt-4o-mini-transcribe');

  const apiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!apiRes.ok) {
    res.status(503).json({ error: 'Transcription failed, please try again', fallback: 'type' });
    return;
  }
  const data = await apiRes.json();
  const text = (data?.text ?? '').trim();
  if (!text) {
    res.status(503).json({ error: 'Could not hear anything — try again closer to the mic', fallback: 'type' });
    return;
  }
  res.status(200).json({ text });
});
