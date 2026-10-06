const { clearSessionCookie, removeSession } = require('../_lib/auth');
const { handleError, requireMethod, send } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    await removeSession(req);
    clearSessionCookie(res);
    return send(res, 200, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
};
