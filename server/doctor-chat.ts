import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { HttpError, readJson, route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { db } from './_lib/db.js';

const msgSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(z.object({ sender: z.enum(['user', 'ai']), text: z.string().max(4000) }))
    .max(20)
    .default([]),
});

const SYSTEM = `You are Wellness AI Doctor, a careful wellness triage companion (NOT a licensed physician).
Rules:
- Reference the user's REAL metrics when provided (mood, sleep, activity, stress, risk).
- Never diagnose. Use "could be consistent with", "consider discussing with a clinician".
- Always give 1 immediate safe action + 1 escalation cue ("seek urgent care if...").
- Crisis words: give 988 / 741741 resources immediately.
- Keep under 150 words, mobile-friendly, end with: "AI triage only — not a diagnosis."
- If risk=high or severe symptoms, recommend booking a Live Doctor in the Counsellor tab.`;

// AI Doctor triage — server key, real wellness context injected server-side.
export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const parsed = msgSchema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid message.');
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'AI service not configured', fallback: 'local' });
    return;
  }

  const sql = db();
  const snaps = await sql`
    select * from wellness_snapshots where user_id = ${user.id} order by recorded_at asc
  `;
  let ctx = 'REAL CONTEXT: no history yet';
  if (snaps.length > 0) {
    const l = snaps[snaps.length - 1];
    ctx =
      `REAL CONTEXT: mood=${Number(l.mood_score)} sleep=${Number(l.sleep_hours)}h ` +
      `activity=${Number(l.activity_level)} stress=${Number(l.stress_index)} ` +
      `risk=${l.risk_level} updated=${new Date(l.recorded_at).toISOString()}`;
  }

  const { message, history } = parsed.data;
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'system', content: ctx },
    ...history.slice(-8).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message },
  ];
  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.4, max_tokens: 450 }),
  });
  if (!apiRes.ok) {
    res.status(503).json({ error: 'AI service unavailable', fallback: 'local' });
    return;
  }
  const data = await apiRes.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    res.status(503).json({ error: 'Empty AI response', fallback: 'local' });
    return;
  }
  res.status(200).json({ reply });
});
