import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from './_lib/db.js';
import { HttpError, readJson, route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { mapLifestyle } from './_lib/mappers.js';

const itemSchema = z.object({
  title: z.string().trim().min(1).max(300),
  creator: z.string().trim().max(200).default(''),
  category: z.string().trim().max(32),
  description: z.string().max(2000).default(''),
  reason: z.string().max(2000).default(''),
  imageUrl: z.string().trim().max(2048).optional(),
  linkUrl: z.string().trim().max(2048).optional(),
});

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const rows = await sql`
      select * from lifestyle_items where user_id = ${user.id} order by created_at desc limit 200
    `;
    res.status(200).json({ items: rows.map(mapLifestyle) });
    return;
  }

  // POST — single object or { items: [...] } bulk (dedup by title+category)
  const body = readJson(req);
  const items = Array.isArray((body as any).items) ? (body as any).items : [body];
  const saved: any[] = [];
  for (const raw of items) {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) continue;
    const it = parsed.data;
    const dup = await sql`
      select id from lifestyle_items
      where user_id = ${user.id} and lower(title) = ${it.title.toLowerCase()} and category = ${it.category}
      limit 1
    `;
    if (dup.length > 0) continue;
    const rows = await sql`
      insert into lifestyle_items (user_id, title, creator, category, description, reason, image_url, link_url)
      values (${user.id}, ${it.title}, ${it.creator}, ${it.category}, ${it.description}, ${it.reason}, ${it.imageUrl ?? null}, ${it.linkUrl ?? null})
      returning *
    `;
    saved.push(mapLifestyle(rows[0]));
  }
  res.status(201).json({ items: saved });
}

export default route(['GET', 'POST'], handler);
