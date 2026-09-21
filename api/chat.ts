import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { HttpError, readJson, route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

const msgSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(z.object({ sender: z.enum(['user', 'ai']), text: z.string().max(4000) }))
    .max(20)
    .default([]),
});

const SYSTEM = `You are Wellness AI, a compassionate, professional mental wellness companion inside the "Wellness AI" wellness app. You passively observe digital wellness signals (screen time, typing dynamics, sleep patterns, activity levels).
Personality: warm, empathetic, non-judgmental; concise and actionable (under 150 words); validate feelings before suggesting; always suggest one specific exercise or activity.
Rules: NOT a licensed medical professional — include a brief disclaimer for serious topics. Crisis (suicide/self-harm): give 988 Lifeline, Crisis Text Line 741741 immediately. Never diagnose ("it sounds like"). Mobile-friendly short paragraphs. Reference app features (Breathwork Timer, Journal, Activity/Sleep tracking). Always include at least one exercise suggestion.`;

// General wellness chat — OpenAI key stays server-side. Without a key we
// answer 503 and the client falls back to its local response engine.
export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  await requireUser(req);
  const parsed = msgSchema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid message.');
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'AI service not configured', fallback: 'local' });
    return;
  }
  const { message, history } = parsed.data;
  const messages = [
    { role: 'system', content: SYSTEM },
    ...history.slice(-10).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message },
  ];
  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7, max_tokens: 500 }),
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
