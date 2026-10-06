const { getSessionUser } = require('../_lib/auth');
const { ensureSchema, getSql } = require('../_lib/db');
const { handleError, requireMethod, send } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    const user = await getSessionUser(req);
    if (!user) return send(res, 401, { error: 'Please log in to request a claim.' });
    const reportId = typeof req.query.id === 'string' ? req.query.id : '';
    if (!/^[0-9a-f-]{36}$/i.test(reportId)) return send(res, 400, { error: 'Invalid report.' });

    const sql = getSql();
    await ensureSchema(sql);
    const [report] = await sql`
      SELECT id, type, owner_id, status FROM reports WHERE id = ${reportId}
    `;
    if (!report) return send(res, 404, { error: 'Report not found.' });
    if (report.owner_id === user.id) return send(res, 403, { error: 'You cannot claim your own report.' });
    if (report.type !== 'found' || !['open', 'not_claimed'].includes(report.status)) {
      return send(res, 409, { error: 'This item is not currently available to claim.' });
    }

    const [claim] = await sql`
      INSERT INTO claims (report_id, claimant_id)
      VALUES (${report.id}, ${user.id})
      ON CONFLICT (report_id) DO NOTHING
      RETURNING id
    `;
    if (!claim) return send(res, 409, { error: 'A claim request has already been submitted for this item.' });
    return send(res, 201, { ok: true, message: 'Claim request submitted for review.' });
  } catch (error) {
    return handleError(res, error);
  }
};
