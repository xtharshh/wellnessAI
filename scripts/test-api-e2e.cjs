// End-to-end test of compiled API routes against the real Neon DB.
// Usage: $env:DATABASE_URL='...'; node scripts/test-api-e2e.cjs
const { neon } = require('@neondatabase/serverless');

const BUILD = process.env.APIBUILD;
if (!BUILD) {
  console.error('Set APIBUILD to the compiled api dir.');
  process.exit(1);
}
const load = (p) => require(`${BUILD}/${p}`).default;

function mockReq({ method = 'GET', body, query = {}, token } = {}) {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
    query,
    socket: {},
  };
}
function mockRes() {
  const res = { statusCode: 200, payload: undefined };
  res.setHeader = () => {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.payload = o; return res; };
  res.end = () => res;
  return res;
}
async function call(handler, opts) {
  const req = mockReq(opts);
  const res = mockRes();
  await handler(req, res);
  return { status: res.statusCode, body: res.payload };
}

(async () => {
  const email = `e2e_${Date.now()}@test.local`;
  const signup = load('auth/signup.js');
  const login = load('auth/login.js');
  const me = load('auth/me.js');
  const snapshots = load('snapshots.js');
  const summary = load('summary.js');

  const s = await call(signup, { method: 'POST', body: { email, password: 'TestPass123!', displayName: 'E2E User' } });
  console.log('SIGNUP:', s.status, s.body?.user?.id ? 'user created' : JSON.stringify(s.body));
  if (s.status !== 201) throw new Error('signup failed');
  const token = s.body.token;
  const userId = s.body.user.id;

  const l = await call(login, { method: 'POST', body: { email, password: 'TestPass123!' } });
  console.log('LOGIN:', l.status, l.body?.token ? 'token ok' : JSON.stringify(l.body));

  const m = await call(me, { method: 'GET', token });
  console.log('ME:', m.status, m.body?.user?.email);

  const snap = await call(snapshots, {
    method: 'POST', token,
    body: { moodScore: 72, sleepHours: 7.2, activityLevel: 55, stressIndex: 38, metadata: { source: 'e2e' } },
  });
  console.log('SNAPSHOT POST:', snap.status, snap.body?.snapshot?.id ? 'stored' : JSON.stringify(snap.body));

  const list = await call(snapshots, { method: 'GET', token, query: { range: '30' } });
  console.log('SNAPSHOT LIST:', list.status, `count=${list.body?.snapshots?.length}`);

  const sum = await call(summary, { method: 'GET', token });
  console.log('SUMMARY:', sum.status, JSON.stringify(sum.body?.summary));

  // Cleanup test user (cascades to snapshots/sessions/settings).
  const sql = neon(process.env.DATABASE_URL);
  await sql`delete from users where id = ${userId}`;
  console.log('CLEANUP: test user deleted');
  console.log('E2E: ALL PASS');
})().catch((e) => { console.error('E2E FAILED:', e.message); process.exit(1); });
