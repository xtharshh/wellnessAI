import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db';
import { HttpError, readJson, route } from '../_lib/http';
import { requireUser } from '../_lib/auth';
import { mapAppointment } from '../_lib/mappers';

const schema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
});

export default route(['PATCH'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const id = req.query.id as string;
  if (!id) throw new HttpError(400, 'Missing appointment id');
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid status.');
  const sql = db();
  const rows = await sql.query(
    'update appointments set status = $3 where id = $1 and user_id = $2 returning *',
    [id, user.id, parsed.data.status]
  );
  if (rows.length === 0) throw new HttpError(404, 'Appointment not found.');
  res.status(200).json({ appointment: mapAppointment(rows[0]) });
});
