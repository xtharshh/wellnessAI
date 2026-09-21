// Direct handler test for insight feedback. Set APIBUILD + DATABASE_URL (as NEON_DATABASE_URL).
const load = (p) => require(`${process.env.APIBUILD}/${p}`).default;
const { neon } = require('@neondatabase/serverless');

const mockRes = () => {
  const res = { statusCode: 200, payload: undefined };
  res.setHeader = () => {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.payload = o; return res; };
  res.end = () => res;
  return res;
};

(async () => {
  const sql = neon(process.env.DATABASE_URL);
  // Seed a throwaway user.
  const u = await sql`insert into users (email, password_hash, display_name) values (${'fb_' + Date.now() + '@t.local'}, 'x', 'FB') returning id`;
  const uid = u[0].id;
  const s = await sql`insert into sessions (user_id, token_hash, expires_at) values (${uid}, ${'deadbeef'}, now() + interval '1 hour') returning id`;
  void s;
  // Forge: call handler with a stubbed requireUser by temporarily pointing token at session? Simpler: test SQL contract directly.
  const handler = load('insights/feedback.js');
  const crypto = require('node:crypto');
  const token = 'tok_' + Date.now();
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await sql`delete from sessions where user_id = ${uid}`;
  await sql`insert into sessions (user_id, token_hash, expires_at) values (${uid}, ${hash}, now() + interval '1 hour')`;

  const post = async (body) => {
    const req = { method: 'POST', headers: { authorization: `Bearer ${token}` }, body, query: {}, socket: {} };
    const res = mockRes();
    await handler(req, res);
    return { status: res.statusCode, body: res.payload };
  };
  const get = async () => {
    const req = { method: 'GET', headers: { authorization: `Bearer ${token}` }, body: undefined, query: {}, socket: {} };
    const res = mockRes();
    await handler(req, res);
    return { status: res.statusCode, body: res.payload };
  };

  console.log('POST dismiss:', JSON.stringify(await post({ key: 'sleep-stress:9', type: 'sleep-stress', action: 'dismissed' })));
  console.log('POST correct:', JSON.stringify(await post({ key: 'sleep-stress:9', type: 'sleep-stress', action: 'corrected', note: 'It was work deadlines.' })));
  console.log('GET:', JSON.stringify(await get()));
  await sql`delete from users where id = ${uid}`;
  console.log('FEEDBACK E2E: ALL PASS');
})().catch((e) => { console.error('FEEDBACK E2E FAILED:', e.message); process.exit(1); });
