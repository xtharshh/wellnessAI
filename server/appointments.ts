import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from './_lib/db.js';
import { HttpError, readJson, route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { mapAppointment } from './_lib/mappers.js';

const postSchema = z.object({
  doctorId: z.string().uuid().nullable().optional(),
  scheduledAt: z.string().datetime(),
  mode: z.enum(['video', 'chat', 'in_person']),
  note: z.string().max(2000).nullable().optional(),
});

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const rows = await sql`
      select * from appointments where user_id = ${user.id} order by scheduled_at asc
    `;
    res.status(200).json({ appointments: rows.map(mapAppointment) });
    return;
  }

  const parsed = postSchema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid booking.');
  if (parsed.data.doctorId) {
    const docs = await sql`
      select id from doctors where id = ${parsed.data.doctorId} and is_available = true limit 1
    `;
    if (docs.length === 0) throw new HttpError(404, 'Doctor not available.');
  }
  const rows = await sql`
    insert into appointments (user_id, doctor_id, scheduled_at, mode, note)
    values (${user.id}, ${parsed.data.doctorId ?? null}, ${parsed.data.scheduledAt}, ${parsed.data.mode}, ${parsed.data.note ?? null})
    returning *
  `;
  res.status(201).json({ appointment: mapAppointment(rows[0]) });
}

export default route(['GET', 'POST'], handler);
