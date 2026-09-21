import type { VercelRequest, VercelResponse } from '@vercel/node';

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

export interface Route {
  methods: string[];
  pattern: RegExp;
  handler: Handler;
  /** name of the dynamic segment to inject into req.query (mirrors [id].ts file routing) */
  param?: string;
}

/** Shared dispatcher for the grouped api/*.ts functions (Hobby plan: max 12 functions). */
export function createDispatcher(routes: Route[]): Handler {
  return async function dispatch(req: VercelRequest, res: VercelResponse) {
    const rawUrl = req.url || '/';
    const pathname = rawUrl.split('?')[0].replace(/\/$/, '') || '/';

    // Merge query-string params (file routing did this for [id].ts handlers).
    const q = new URLSearchParams(rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : '');
    req.query = { ...(req.query || {}) };
    q.forEach((v, k) => {
      if (req.query[k] === undefined) req.query[k] = v;
    });

    for (const r of routes) {
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
  };
}
