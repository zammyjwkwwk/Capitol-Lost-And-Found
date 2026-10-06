# Capitol Lost & Found

This static site uses Vercel serverless API routes and Neon PostgreSQL for
accounts, reports, and claim requests.

## Deployment configuration

Set `DATABASE_URL` in the Vercel project as a secret for each environment you
deploy. Use the pooled Neon connection string. Never put it in browser code,
commit it, or share it in screenshots.

Each API route creates the required tables on its first request. After deploying
the API code and setting `DATABASE_URL`, register an account to verify the
connection. Existing browser-only accounts and sample reports are not migrated.

## API routes

- `POST /api/auth/register` and `POST /api/auth/login` create an HttpOnly session.
- `POST /api/auth/logout` ends the session; `GET /api/auth/me` checks it.
- `GET /api/reports` lists reports; authenticated users can submit with
  `POST /api/reports`.
- Authenticated users can request a claim with
  `POST /api/reports/claim?id=<report-id>`.
- `GET` and `POST /api/reports/<report-id>/comments` list and add comments.
- The report owner can set `not_claimed` or `claimed` with
  `POST /api/reports/status?id=<report-id>`.

Passwords are hashed on the server and session tokens are stored hashed in the
database. Image selection currently previews locally; uploaded files are not
stored. Email verification, password recovery, moderation tools, and login
rate-limiting still need to be added before treating this as a production service.

The home page accepts a YouTube link and embeds the video using YouTube's
privacy-enhanced embed host. The About page credits the Lost and Found Team.
