const { getSessionUser } = require('../_lib/auth');
const { handleError, requireMethod, send } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, 'GET')) return;
  try {
    const user = await getSessionUser(req);
    return send(res, 200, { user });
  } catch (error) {
    return handleError(res, error);
  }
};
