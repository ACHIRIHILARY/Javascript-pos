# Javascript POS Backend
Express 5 + Prisma + PostgreSQL backend for POS and inventory management, implemented in JavaScript with API versioning, Winston logging, and role-based access control.

## Implemented architecture
- `src/index.js`: server startup and graceful shutdown
- `src/app.js`: app bootstrap (helmet, CORS, rate limit, JSON parsing, route mounting)
- `src/routes/v1/`: versioned REST API modules
- `src/middleware/`: auth, RBAC, validation, request logging, 404 and error handling
- `src/lib/`: Prisma client, JWT helpers, logger, validators, domain services
- `prisma/schema.prisma`: data model and enums
- `prisma/seed.js`: seed data and bootstrap users

## API base and versioning
- Base URL: `http://localhost:3001`
- Versioned API root: `/api/v1`
- Health check: `GET /api/health`

## Security and operational middleware
- `helmet` for common security headers
- `express-rate-limit` for API throttling
- JWT auth middleware for protected routes
- RBAC middleware for OWNER/ADMIN/CASHIER role checks
- Winston structured logs:
  - `logs/combined.log`
  - `logs/error.log`

## Environment configuration
Copy `.env.example` to `.env` and set values:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

## Installation and startup
1. Install dependencies
   - `npm install`
2. Generate Prisma client
   - `npx prisma generate`
3. Push schema to database
   - `npx prisma db push`
4. Seed sample data and test users
   - `npm run db:seed`
5. Start API in development
   - `npm run dev`

Production-like startup:
- `npm start`

## Seeded test users
After running `npm run db:seed`:
- OWNER
  - email: `owner@pos.local`
  - password: `owner12345`
- CASHIER
  - email: `cashier@pos.local`
  - password: `cashier12345`

## Endpoint coverage
### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Categories
- `GET /api/v1/categories`
- `POST /api/v1/categories` (OWNER/ADMIN)

### Products
- `GET /api/v1/products`
- `POST /api/v1/products` (OWNER/ADMIN)
- `GET /api/v1/products/:id`
- `PATCH /api/v1/products/:id` (OWNER/ADMIN)
- `DELETE /api/v1/products/:id` (OWNER/ADMIN, soft delete)
- `POST /api/v1/products/:id/adjust` (OWNER/ADMIN)
- `POST /api/v1/products/import` (OWNER/ADMIN, `text/csv`)
- `GET /api/v1/products/export/csv` (OWNER/ADMIN)

### Sales
- `POST /api/v1/sales` (transactional checkout)
- `GET /api/v1/sales`
- `GET /api/v1/sales/:id`

### Reports
- `GET /api/v1/reports/summary?period=day|week|month`
- `GET /api/v1/reports/top-products`
- `GET /api/v1/reports/summary/export/csv?period=day|week|month`

### Users
- `GET /api/v1/users` (OWNER/ADMIN)
- `POST /api/v1/users` (OWNER/ADMIN)
- `PATCH /api/v1/users/:id` (OWNER/ADMIN)

### Shifts
- `POST /api/v1/shifts/end` (OWNER/ADMIN/CASHIER)
- `GET /api/v1/shifts/report` (OWNER/ADMIN)

## API testing flow (recommended)
1. Login as owner:
   - `POST /api/v1/auth/login`
2. Copy token from response.
3. Send protected requests with header:
   - `Authorization: Bearer <token>`
4. Test inventory lifecycle:
   - create category -> create product -> adjust stock -> create sale -> inspect reports.

## Running tests
- All tests:
  - `npm test`
- Watch mode:
  - `npm run test:watch`
- Single test file:
  - `npm run test:single -- tests/unit/sale.service.test.js`

## Notes for frontend integration
- All frontend API calls should target `/api/v1/*`.
- Response contract:
  - success: `{ success: true, data: ... }`
  - error: `{ success: false, error: { code, message } }`
- Auth-protected routes require bearer token.
- Product and report CSV endpoints are available for import/export workflows.
