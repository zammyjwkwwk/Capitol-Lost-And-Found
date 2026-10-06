const { getSessionUser } = require('../../_lib/auth');
const { ensureSchema, getSql } = require('../../_lib/db');
const { handleError, readJson, send } = require('../../_lib/http');

module.exports = async function handler(req, res) {
  try {
    const reportId = typeof req.query.id === 'string' ? req.query.id : '';
    if (!/^[0-9a-f-]{36}$/i.test(reportId)) return send(res, 400, { error: 'Invalid report.' });

    const sql = getSql();
    await ensureSchema(sql);
    if (req.method === 'GET') {
      const comments = await sql`
        SELECT comments.id, comments.body, users.name AS "authorName",
          comments.created_at AS "createdAt"
        FROM comments
        JOIN users ON users.id = comments.user_id
        WHERE comments.report_id = ${reportId}
        ORDER BY comments.created_at ASC
      `;
      return send(res, 200, { comments });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return send(res, 405, { error: 'Method not allowed.' });
    }

    const user = await getSessionUser(req);
    if (!user) return send(res, 401, { error: 'Log in to comment on this post.' });
    const body = readJson(req)?.body;
    const commentBody = typeof body === 'string' ? body.trim() : '';
    if (!commentBody || commentBody.length > 1000) {
      return send(res, 400, { error: 'Comments must be between 1 and 1000 characters.' });
    }
    const [comment] = await sql`
      INSERT INTO comments (report_id, user_id, body)
      SELECT reports.id, ${user.id}, ${commentBody}
      FROM reports
      WHERE reports.id = ${reportId}
      RETURNING id, body, created_at AS "createdAt"
    `;
    if (!comment) return send(res, 404, { error: 'Report not found.' });
    return send(res, 201, {
      comment: { ...comment, authorName: user.name },
    });
  } catch (error) {
    return handleError(res, error);
  }
};
