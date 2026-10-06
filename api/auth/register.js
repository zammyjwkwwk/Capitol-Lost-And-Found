const { createSession, hashPassword } = require('../_lib/auth');
const { ensureSchema, getSql } = require('../_lib/db');
const { handleError, readJson, requireMethod, send } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  const body = readJson(req);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) {
    return send(res, 400, { error: 'Enter a valid email and a password between 8 and 128 characters.' });
  }

  try {
    const sql = getSql();
    await ensureSchema(sql);
    const name = email.split('@')[0].replace(/[._-]/g, ' ');
    const [user] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${await hashPassword(password)})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email
    `;
    if (!user) return send(res, 409, { error: 'An account with that email already exists.' });
    const sessionUser = await createSession(req, res, user);
    return send(res, 201, { user: sessionUser });
  } catch (error) {
    return handleError(res, error);
  }
};
