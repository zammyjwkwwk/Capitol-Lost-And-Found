const { getSessionUser } = require('../_lib/auth');
const { ensureSchema, getSql } = require('../_lib/db');
const { handleError, readJson, send } = require('../_lib/http');

const DEFAULT_IMAGES = {
  Wallet: 'wallet.png',
  Phone: 'phone.png',
  Laptop: 'laptop.png',
  Keys: 'keys.png',
  Umbrella: 'umbrella.png',
  Books: 'book.png',
  Bag: 'wallet.png',
  Calculator: 'calculator.png',
  Others: 'wallet.png',
};

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureSchema(sql);

    if (req.method === 'GET') {
      const reports = await sql`
        SELECT id, type, title, category, location,
          to_char(item_date, 'YYYY-MM-DD') AS date,
          description, status, image, owner_id AS "ownerId", created_at AS "createdAt"
        FROM reports
        ORDER BY created_at DESC
      `;
      return send(res, 200, { reports });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return send(res, 405, { error: 'Method not allowed.' });
    }

    const user = await getSessionUser(req);
    if (!user) return send(res, 401, { error: 'Please log in to submit a report.' });
    const body = readJson(req);
    const type = body?.type;
    const title = text(body?.title, 120);
    const category = text(body?.category, 60);
    const location = text(body?.location, 160);
    const date = text(body?.date, 10);
    const description = text(body?.description, 2000);
    const studentName = text(body?.studentName, 120);
    const studentId = text(body?.studentId, 60);
    const itemDate = new Date(`${date}T00:00:00.000Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(itemDate.valueOf()) && itemDate.toISOString().slice(0, 10) === date;

    if (!['lost', 'found'].includes(type) || !title || !category || !location || !description || !studentName || !studentId || !validDate) {
      return send(res, 400, { error: 'Complete all report fields with valid values.' });
    }

    const image = DEFAULT_IMAGES[category] || 'wallet.png';
    const [report] = await sql`
      INSERT INTO reports (
        type, title, category, location, item_date, description,
        image, owner_id, student_name, student_id
      )
      VALUES (
        ${type}, ${title}, ${category}, ${location}, ${date},
        ${description}, ${image}, ${user.id}, ${studentName}, ${studentId}
      )
      RETURNING id, type, title, category, location,
        to_char(item_date, 'YYYY-MM-DD') AS date,
        description, status, image, owner_id AS "ownerId",
        created_at AS "createdAt"
    `;
    return send(res, 201, { report });
  } catch (error) {
    return handleError(res, error);
  }
};
