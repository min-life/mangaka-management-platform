# Env vars

- api: `DATABASE_URL` (Postgres), `PORT`, `WEB_ORIGIN` (allowed CORS origins), JWT secrets, Google OAuth creds, AWS S3 creds (for `share/services/aws-s3.service.ts`), SMTP/nodemailer config for `mail`.
- web: `NEXT_PUBLIC_API_URL` (points at the api's `/api` prefix).
