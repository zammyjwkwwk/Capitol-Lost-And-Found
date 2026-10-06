const { createSession, verifyPassword } = require('../_lib/auth');
const { ensureSchema, getSql } = require('../_lib/db');
const { handleError, readJson, requireMethod, send } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  const body = readJson(req);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password || email.length > 254 || password.length > 128) {
    return send(res, 400, { error: 'Enter your email and password.' });
  }

  try {
    const sql = getSql();
    await ensureSchema(sql);
    const [user] = await sql`
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ${email}
    `;
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return send(res, 401, { error: 'Invalid email or password. Please try again.' });
    }
    const sessionUser = await createSession(req, res, user);
    return send(res, 200, { user: sessionUser });
  } catch (error) {
    return handleError(res, error);
  }
};
