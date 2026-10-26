# Vabbot PMS Node backend

Run `npm run backend:dev` to start the dedicated API at `http://127.0.0.1:4000`.

Authentication is bearer-token based. Call `POST /api/auth/login` with `email` and `password`, then send `Authorization: Bearer <token>` to PMS endpoints.

- `GET /health`
- `GET /api/pms/properties/:propertyId/dashboard`
- `GET /api/pms/properties/:propertyId/calendar?roomId=&start=&end=`
- `POST /api/pms/actions` for `create-unit`, `set-unit-status`, `create-rate-plan`, `upsert-staff`, and `quote`.
- `POST /api/pms/properties` creates a hotel/listing draft.
- `PATCH /api/pms/properties/:propertyId` updates listing details and its image URLs.
- `POST /api/pms/uploads/images` stores a JPEG, PNG, or WebP image supplied as base64 and returns its `/uploads/...` URL.
- `POST /api/pms/properties/:propertyId/publish` runs publication checks.

The server uses `DATABASE_PATH` and shares the existing local SQLite schema. Replace it with a PostgreSQL data adapter before Vercel production deployment.
