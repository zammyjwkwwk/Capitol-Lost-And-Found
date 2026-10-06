const { createHash, randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { ensureSchema, getSql } = require('./db');

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'claf_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const entry = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DURATION_MS / 1000}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

async function createSession(req, res, user) {
  const sql = getSql();
  await ensureSchema(sql);
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${user.id}, ${expiresAt.toISOString()})
  `;
  setSessionCookie(res, token);
  return { id: user.id, name: user.name, email: user.email };
}

async function getSessionUser(req) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const sql = getSql();
  await ensureSchema(sql);
  const [user] = await sql`
    SELECT users.id, users.name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ${hashToken(token)}
      AND sessions.expires_at > now()
  `;
  return user || null;
}

async function removeSession(req) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return;
  const sql = getSql();
  await ensureSchema(sql);
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, storedKey] = storedHash.split(':');
  if (!salt || !storedKey) return false;
  const key = await scrypt(password, salt, 64);
  const expected = Buffer.from(storedKey, 'hex');
  return expected.length === key.length && timingSafeEqual(key, expected);
}

module.exports = {
  clearSessionCookie,
  createSession,
  getSessionUser,
  hashPassword,
  removeSession,
  verifyPassword,
};
