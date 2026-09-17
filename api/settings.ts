import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from './_lib/db';
import { HttpError, readJson, route } from './_lib/http';
import { requireUser } from './_lib/auth';

const schema = z.object({
  notificationsEnabled: z.boolean().optional(),
  dataSharingEnabled: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

function mapSettings(row: any) {
  return {
    notificationsEnabled: !!row.notifications_enabled,
    dataSharingEnabled: !!row.data_sharing_enabled,
    theme: row.theme as 'light' | 'dark',
  };
}

const DEFAULTS = { notificationsEnabled: true, dataSharingEnabled: false, theme: 'light' as const };

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const rows = await sql`select * from user_settings where user_id = ${user.id} limit 1`;
    if (rows.length === 0) {
      await sql`insert into user_settings (user_id) values (${user.id}) on conflict do nothing`;
      res.status(200).json({ settings: DEFAULTS });
      return;
    }
    res.status(200).json({ settings: mapSettings(rows[0]) });
    return;
  }

  // PATCH
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid settings.');
  const patch = parsed.data;
  if (Object.keys(patch).length === 0) throw new HttpError(400, 'Nothing to update');

  const sets: string[] = [];
  const values: any[] = [];
  if (patch.notificationsEnabled !== undefined) {
    sets.push(`notifications_enabled = $${sets.length + 2}`);
    values.push(patch.notificationsEnabled);
  }
  if (patch.dataSharingEnabled !== undefined) {
    sets.push(`data_sharing_enabled = $${sets.length + 2}`);
    values.push(patch.dataSharingEnabled);
  }
  if (patch.theme !== undefined) {
    sets.push(`theme = $${sets.length + 2}`);
    values.push(patch.theme);
  }
  const rows = await sql.query(
    `insert into user_settings (user_id) values ($1)
     on conflict (user_id) do update set ${sets.join(', ')}
     returning *`,
    [user.id, ...values]
  );
  res.status(200).json({ settings: mapSettings(rows[0]) });
}

export default route(['GET', 'PATCH'], handler);
