import { createDispatcher } from '../server/_lib/dispatch.js';
import signup from '../server/auth/signup.js';
import login from '../server/auth/login.js';
import logout from '../server/auth/logout.js';
import me from '../server/auth/me.js';
import profile from '../server/auth/profile.js';
import password from '../server/auth/password.js';
import forgot from '../server/auth/forgot.js';
import reset from '../server/auth/reset.js';
import oauth from '../server/auth/oauth.js';

export default createDispatcher([
  { methods: ['POST'], pattern: /^\/api\/auth\/signup$/, handler: signup },
  { methods: ['POST'], pattern: /^\/api\/auth\/login$/, handler: login },
  { methods: ['POST'], pattern: /^\/api\/auth\/logout$/, handler: logout },
  { methods: ['GET'], pattern: /^\/api\/auth\/me$/, handler: me },
  { methods: ['PATCH'], pattern: /^\/api\/auth\/profile$/, handler: profile },
  { methods: ['POST'], pattern: /^\/api\/auth\/password$/, handler: password },
  { methods: ['POST'], pattern: /^\/api\/auth\/forgot$/, handler: forgot },
  { methods: ['POST'], pattern: /^\/api\/auth\/reset$/, handler: reset },
  { methods: ['POST'], pattern: /^\/api\/auth\/oauth$/, handler: oauth },
]);
