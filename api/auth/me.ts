import type { VercelRequest, VercelResponse } from '@vercel/node';

import { route } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';

export default route(['GET'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  res.status(200).json({ user });
});
