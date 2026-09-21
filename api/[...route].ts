import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Single-function API (Hobby plan: max 12 serverless functions) ─────
// All routes live in server/ (plain modules, NOT functions). This required
// catch-all [...route].ts is the ONLY function under api/ and dispatches
// to the right handler by method + pathname. Dynamic :id segments are
// injected into req.query.id, mirroring Vercel's [id].ts file routing.

import health from '../server/health.js';
import signup from '../server/auth/signup.js';
import login from '../server/auth/login.js';
import logout from '../server/auth/logout.js';
import me from '../server/auth/me.js';
import profile from '../server/auth/profile.js';
import password from '../server/auth/password.js';
import forgot from '../server/auth/forgot.js';
import reset from '../server/auth/reset.js';
import oauth from '../server/auth/oauth.js';
import settings from '../server/settings.js';
import snapshots from '../server/snapshots.js';
import summary from '../server/summary.js';
import feedback from '../server/insights/feedback.js';
import recommendations from '../server/recommendations.js';
import recommendationsGenerate from '../server/recommendations/generate.js';
import recommendationById from '../server/recommendations/[id].js';
import journals from '../server/journals.js';
import journalById from '../server/journals/[id].js';
import exercises from '../server/exercises.js';
import exerciseById from '../server/exercises/[id].js';
import lifestyle from '../server/lifestyle.js';
import doctors from '../server/doctors.js';
import appointments from '../server/appointments.js';
import appointmentById from '../server/appointments/[id].js';
import chat from '../server/chat.js';
import doctorChat from '../server/doctor-chat.js';
import transcribe from '../server/voice/transcribe.js';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

interface Route {
  methods: string[];
  pattern: RegExp;
  handler: Handler;
  param?: string;
}

const ROUTES: Route[] = [
  { methods: ['GET'], pattern: /^\/api\/health$/, handler: health },
  { methods: ['POST'], pattern: /^\/api\/auth\/signup$/, handler: signup },
  { methods: ['POST'], pattern: /^\/api\/auth\/login$/, handler: login },
  { methods: ['POST'], pattern: /^\/api\/auth\/logout$/, handler: logout },
  { methods: ['GET'], pattern: /^\/api\/auth\/me$/, handler: me },
  { methods: ['PATCH'], pattern: /^\/api\/auth\/profile$/, handler: profile },
  { methods: ['POST'], pattern: /^\/api\/auth\/password$/, handler: password },
  { methods: ['POST'], pattern: /^\/api\/auth\/forgot$/, handler: forgot },
  { methods: ['POST'], pattern: /^\/api\/auth\/reset$/, handler: reset },
  { methods: ['POST'], pattern: /^\/api\/auth\/oauth$/, handler: oauth },
  { methods: ['GET', 'PATCH'], pattern: /^\/api\/settings$/, handler: settings },
  { methods: ['GET', 'POST'], pattern: /^\/api\/snapshots$/, handler: snapshots },
  { methods: ['GET'], pattern: /^\/api\/summary$/, handler: summary },
  { methods: ['GET', 'POST'], pattern: /^\/api\/insights\/feedback$/, handler: feedback },
  { methods: ['GET'], pattern: /^\/api\/recommendations$/, handler: recommendations },
  { methods: ['POST'], pattern: /^\/api\/recommendations\/generate$/, handler: recommendationsGenerate },
  { methods: ['PATCH', 'DELETE'], pattern: /^\/api\/recommendations\/([^/]+)$/, handler: recommendationById, param: 'id' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/journals$/, handler: journals },
  { methods: ['DELETE'], pattern: /^\/api\/journals\/([^/]+)$/, handler: journalById, param: 'id' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/exercises$/, handler: exercises },
  { methods: ['PATCH', 'DELETE'], pattern: /^\/api\/exercises\/([^/]+)$/, handler: exerciseById, param: 'id' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/lifestyle$/, handler: lifestyle },
  { methods: ['GET'], pattern: /^\/api\/doctors$/, handler: doctors },
  { methods: ['GET', 'POST'], pattern: /^\/api\/appointments$/, handler: appointments },
  { methods: ['PATCH'], pattern: /^\/api\/appointments\/([^/]+)$/, handler: appointmentById, param: 'id' },
  { methods: ['POST'], pattern: /^\/api\/chat$/, handler: chat },
  { methods: ['POST'], pattern: /^\/api\/doctor-chat$/, handler: doctorChat },
  { methods: ['POST'], pattern: /^\/api\/voice\/transcribe$/, handler: transcribe },
];

export default async function dispatch(req: VercelRequest, res: VercelResponse) {
  const rawUrl = req.url || '/api';
  const pathname = rawUrl.split('?')[0].replace(/\/$/, '') || '/';

  // Merge query-string params (file routing did this for [id].ts handlers).
  const q = new URLSearchParams(rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : '');
  req.query = { ...(req.query || {}) };
  q.forEach((v, k) => {
    if (req.query[k] === undefined) req.query[k] = v;
  });

  for (const r of ROUTES) {
    if (!r.methods.includes(req.method ?? '')) continue;
    const m = pathname.match(r.pattern);
    if (!m) continue;
    if (r.param) req.query[r.param] = decodeURIComponent(m[1]);
    await r.handler(req, res);
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ error: 'Not found' });
}
