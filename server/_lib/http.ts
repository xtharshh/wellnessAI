import type { VercelRequest, VercelResponse } from '@vercel/node';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function setCors(res: VercelResponse) {
  // Bearer-token auth (no cookies), so a permissive origin is safe for v1.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

export function route(methods: string[], handler: Handler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    if (!methods.includes(req.method ?? '')) {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    try {
      await handler(req, res);
    } catch (e) {
      if (e instanceof HttpError) {
        res.status(e.status).json({ error: e.message });
        return;
      }
      console.error('[api]', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function readJson<T = Record<string, any>>(req: VercelRequest): T {
  const raw = (req as any).body;
  if (raw === undefined || raw === null) return {} as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new HttpError(400, 'Invalid JSON body');
    }
  }
  return raw as T;
}

export function getBearer(req: VercelRequest): string {
  const h = req.headers.authorization;
  if (!h || !h.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'Missing bearer token');
  }
  return h.slice(7).trim();
}

// Best-effort per-instance rate limiter (protects auth endpoints from abuse).
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return (req.socket as any)?.remoteAddress ?? 'unknown';
}
