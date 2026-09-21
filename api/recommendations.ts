import type { VercelRequest, VercelResponse } from '@vercel/node';

import { db } from './_lib/db';
import { route } from './_lib/http';
import { requireUser } from './_lib/auth';
import { mapRecommendation } from './_lib/mappers';

export default route(['GET'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const rows = await db()`
    select * from recommendations
    where user_id = ${user.id} and dismissed = false
    order by priority asc
  `;
  res.status(200).json({ recommendations: rows.map(mapRecommendation) });
});
