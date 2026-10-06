function send(res, status, data) {
  res.status(status).json(data);
}

function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

function handleError(res, error) {
  console.error('API request failed:', error);
  send(res, 500, {
    error: process.env.DATABASE_URL
      ? 'The request could not be completed. Please try again.'
      : 'The database connection is not configured on the server.',
  });
}

function requireMethod(req, res, method) {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  send(res, 405, { error: 'Method not allowed.' });
  return false;
}

module.exports = { handleError, readJson, requireMethod, send };
