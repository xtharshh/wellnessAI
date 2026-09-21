import type { VercelRequest, VercelResponse } from '@vercel/node';

import { route } from '../_lib/http.js';
import { destroySession } from '../_lib/auth.js';

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  await destroySession(req);
  res.status(200).json({ ok: true });
});
