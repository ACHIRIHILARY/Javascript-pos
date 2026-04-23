# Javascript POS Backend
This repository contains the backend API for a POS and inventory management system built with Express 5, Prisma, PostgreSQL, and JavaScript.

## Implemented backend architecture
- `src/index.js`: server entry point, graceful shutdown, process-level exception/rejection logging.
- `src/app.js`: Express app composition (CORS, JSON parser, request logging, route mounting, 404, global error handler).
- `src/routes/v1/`: API versioned route modules:
  - `auth.js`
  - `products.js`
  - `sales.js`
  - `reports.js`
  - `users.js`
- `src/middleware/`: authentication, RBAC, body validation, request logging, error handling.
- `src/lib/`: shared infrastructure:
  - `prisma.js` (Prisma client)
  - `auth.js` (JWT signing/verifying)
  - `logger.js` (Winston logging)
  - `services/sale.service.js` (atomic checkout transaction)
  - `validators/*.js` (Zod schemas)
- `prisma/schema.prisma`: core domain schema (users, products, sales, stock movement).
- `tests/unit/`: baseline Vitest tests.

## API versioning
All business routes are mounted under:
- `/api/v1`

Health endpoint:
- `GET /api/health`

## Features implemented
- JWT login/refresh/logout (`/api/v1/auth/*`)
- RBAC-protected product CRUD + stock adjustment with audit trail
- Transactional sale checkout with row-level locking (`FOR UPDATE`) and stock decrement
- Sales listing and detail endpoints
- Summary and top-products reports for OWNER/ADMIN roles
- User management endpoints for OWNER/ADMIN roles
- Standard response envelope:
  - success: `{ "success": true, "data": ... }`
  - error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

## Winston logging and exception handling
- Request logging middleware writes structured logs per request.
- Error middleware logs structured error objects and returns sanitized API errors.
- Process-level handlers log:
  - uncaught exceptions
  - unhandled promise rejections
- Log files:
  - `logs/combined.log`
  - `logs/error.log`

## Setup
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - Copy `.env.example` to `.env`
   - Set values for `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`
3. Generate Prisma client and prepare DB:
   - `npx prisma generate`
   - `npx prisma db push`
4. Seed sample data (optional):
   - `npm run db:seed`

## Run backend
- Development:
  - `npm run dev`
- Production-like run:
  - `npm start`

Default API base URL:
- `http://localhost:3001/api/v1`

## Testing
- Run all tests:
  - `npm test`
- Watch mode:
  - `npm run test:watch`
- Run a single test file:
  - `npm run test:single -- tests/unit/sale.validator.test.js`

## Common backend API endpoints
- Auth
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
- Products
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `GET /api/v1/products/:id`
  - `PATCH /api/v1/products/:id`
  - `DELETE /api/v1/products/:id`
  - `POST /api/v1/products/:id/adjust`
- Sales
  - `POST /api/v1/sales`
  - `GET /api/v1/sales`
  - `GET /api/v1/sales/:id`
- Reports
  - `GET /api/v1/reports/summary?period=day|week|month`
  - `GET /api/v1/reports/top-products`
- Users
  - `GET /api/v1/users`
  - `POST /api/v1/users`
  - `PATCH /api/v1/users/:id`

## Notes for continued development
- Current backend is fully JavaScript (no TypeScript files).
- Keep new routes under `/api/v1` to preserve API versioning consistency.
- Extend Zod validators first when adding/changing endpoint payloads.
- Stock-changing flows should stay transactional and write to `StockMovement`.



//sumary note of total project implementation.
Implemented. I built a modular JavaScript backend from speck.md in this repo, added API versioning, Winston logging/exception handling, and wrote a full README.md for setup/run/testing.

What I changed

Backend architecture + versioned API
•  Created src/ structure with separation of concerns:
◦  src/index.js (entrypoint, graceful shutdown, process exception/rejection handlers)
◦  src/app.js (Express app composition)
◦  src/routes/v1/ (versioned routes mounted at /api/v1)
◦  src/middleware/ (auth, RBAC, validation, request logging, error handling, 404)
◦  src/lib/ (Prisma client, JWT helpers, Winston logger, validators, sale service)
◦  src/utils/ (app error type + async wrapper)

Business endpoints implemented (all under /api/v1)
•  Auth: login, refresh, logout
•  Products: list/search/filter, create, get by id, update, soft delete, stock adjust
•  Sales: create sale, list (paginated), get by id
•  Reports: summary (period=day|week|month), top products
•  Users: list, create, update

Transactional POS checkout
•  Added src/lib/services/sale.service.js with Prisma interactive transaction:
◦  deterministic item ordering
◦  row locking with FOR UPDATE
◦  stock validation inside transaction
◦  atomic sale + sale items + stock decrement + stock movement audit trail

Winston logging + exception handling
•  Added structured logger in src/lib/logger.js
•  Request logging middleware in src/middleware/requestLogger.js
•  Centralized API error formatting/logging in src/middleware/errorHandler.js
•  Process-level handlers for uncaughtException and unhandledRejection
•  File logs configured to logs/combined.log and logs/error.log

Config/scripts/docs/tests
•  Updated package.json scripts/dependencies for new backend runtime and testing
•  Updated .env.example with DB/JWT/CORS/server vars
•  Updated server.js to delegate to new entrypoint
•  Added unit test: tests/unit/sale.validator.test.js
•  Wrote full backend onboarding/run guide in README.md



Files/folders touched (with brief note)

•  package.json — scripts + dependencies for Express backend modules/testing.
•  .env.example — backend env variables (DB, JWT, CORS, port).
•  server.js — compatibility entrypoint redirect to new backend bootstrap.
•  README.md — complete setup/run/test and API usage documentation.
•  src/config/env.js — centralized env config.
•  src/lib/logger.js — Winston setup + log directory creation.
•  src/lib/prisma.js — Prisma client singleton.
•  src/lib/auth.js — JWT sign/verify helpers.
•  src/lib/services/sale.service.js — transactional sale core logic.
•  src/lib/validators/*.js — Zod schemas for auth/product/sale/user payloads.
•  src/middleware/auth.js — JWT auth middleware.
•  src/middleware/rbac.js — role checks.
•  src/middleware/validate.js — request body validation.
•  src/middleware/requestLogger.js — request logging.
•  src/middleware/errorHandler.js — global error handler.
•  src/middleware/notFound.js — 404 handling.
•  src/routes/v1/auth.js — auth endpoints.
•  src/routes/v1/products.js — product/inventory endpoints.
•  src/routes/v1/sales.js — sales endpoints.
•  src/routes/v1/reports.js — reports endpoints.
•  src/routes/v1/users.js — user management endpoints.
•  src/routes/v1/index.js — route aggregator.
•  src/utils/AppError.js — custom typed API errors.
•  src/utils/asyncHandler.js — async route wrapper.
•  src/app.js — express app assembly and /api/v1 mounting.
•  src/index.js — server runtime lifecycle.
•  tests/unit/sale.validator.test.js — baseline unit test.



Third-party tools/libraries used
•  express
•  @prisma/client / prisma
•  winston
•  jsonwebtoken
•  bcryptjs
•  zod
•  cors
•  dotenv
•  vitest
•  nodemon
•  pg



Validation run
•  npm install ✅
•  npm test ✅ (all tests passed)
•  runtime import check of src/app.js ✅