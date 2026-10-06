const { getSessionUser } = require('../_lib/auth');
const { ensureSchema, getSql } = require('../_lib/db');
const { handleError, readJson, requireMethod, send } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const user = await getSessionUser(req);
    if (!user) return send(res, 401, { error: 'Please log in to update claim status.' });

    const reportId = typeof req.query.id === 'string' ? req.query.id : '';
    const status = readJson(req)?.status;
    if (!/^[0-9a-f-]{36}$/i.test(reportId) || !['not_claimed', 'claimed'].includes(status)) {
      return send(res, 400, { error: 'Choose a valid claim status.' });
    }

    const sql = getSql();
    await ensureSchema(sql);
    const [report] = await sql`
      UPDATE reports
      SET status = ${status}
      WHERE id = ${reportId} AND owner_id = ${user.id}
      RETURNING id, status
    `;
    if (!report) {
      const [exists] = await sql`SELECT id FROM reports WHERE id = ${reportId}`;
      return exists
        ? send(res, 403, { error: 'Only the person who posted this item can change its status.' })
        : send(res, 404, { error: 'Report not found.' });
    }
    return send(res, 200, { report });
  } catch (error) {
    return handleError(res, error);
  }
};
