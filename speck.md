Project Specification: POS & Inventory Management System
> Version: 1.0.0  
> Date: 2026-03-27  
> Status: Draft  
> Stack: PostgreSQL · Express.js 5 · React 18 · Node.js 20 · TypeScript · Prisma · Tailwind CSS (PERN)
***1. Executive Summary
A lightweight, Progressive-Web-App Point-of-Sale and Inventory Management System built for a small-to-medium retail business. The owner can monitor sales and stock levels remotely from any device (phone, tablet, laptop) by installing the PWA or choosing not to install any software. Cashiers interact with a clean POS terminal to record sales. All sale transactions are guaranteed to be atomic — a sale is never saved without a matching stock decrease, and stock can never go negative.
Core Value Propositions
Remote visibility — owner dashboard accessible from any browser, anywhere
Data integrity — Prisma $transaction ensures sales and stock are always in sync
Cost-effective — entire stack runs on free/low-cost cloud services (Railway + Netlify + PostgreSQL)
Clean separation — dedicated Express API and React client are independently deployable and testable
***2. Stakeholders & Roles
| Role      | Description                                                         |
|-----------|---------------------------------------------------------------------|
| OWNER   | Full access. Views reports, manages products, users, and settings.  |
| CASHIER | Can create sales and view their own transaction history only.       |
| ADMIN   | (Optional) Technical role for seeding products and managing users.  |
***3. Functional Requirements
3.1 Authentication
Email/password login returning a signed JWT (jsonwebtoken + bcryptjs)
Role-based route protection (middleware-level)
Session timeout after 8 hours of inactivity
3.2 Product Management (OWNER / ADMIN)
Create, read, update, and soft-delete products
Fields: name, barcode, category, selling price, stock quantity, low-stock threshold
Bulk import products via CSV upload
Manual stock adjustment with required reason note (audit trail)
3.3 POS — Sale Recording (CASHIER / OWNER)
Search products by name or scan by barcode
Add multiple line items (product + quantity) to a cart
Choose payment method: Cash, Card, Mobile Money
On checkout:
Validate every item has sufficient stock
Persist the Sale record
Persist each SaleItem
Decrement each product's stock by the sold quantity
Append a StockMovement row (audit trail)
Steps 2–5 run inside a single Prisma $transaction — all succeed or all roll back
Print/download a receipt (PDF or thermal-printer-ready HTML)
3.4 Inventory Management (OWNER)
View current stock levels, filterable by category and low-stock flag
View full stock movement history per product
Low-stock alert badges in the dashboard
3.5 Sales Reports (OWNER)
Daily, weekly, monthly sales summaries (total revenue, number of transactions)
Best-selling products table
Revenue by category chart
Export data to CSV
3.6 Remote Dashboard (OWNER)
Secure, real-time-capable summary tiles:
Today's revenue
Number of sales today
Products below reorder threshold
Accessible on mobile and desktop (responsive design)
No VPN or special network setup required — it's just a web URL
***4. Non-Functional Requirements
| Category        | Requirement                                                         |
|-----------------|---------------------------------------------------------------------|
| Performance     | Page load < 2 s on 4G; API response < 500 ms for typical queries   |
| Availability    | 99.9 % uptime (Railway + Netlify SLA)                              |
| Security        | HTTPS everywhere; parameterized queries (Prisma); RBAC middleware   |
| Scalability     | Stateless Express API; horizontal scaling via Docker containers; PostgreSQL connection pooling (pgBouncer or pgPool) |
| Auditability    | Every stock change is recorded in StockMovement                   |
| Cost            | $0/month baseline (free tiers); < $25/month at production scale     |
***5. Technology Stack
5.1 Backend (Express API Server)
| Layer          | Technology                           | Rationale                                              |
|----------------|--------------------------------------|--------------------------------------------------------|
| Runtime        | Node.js 20 + Express.js 5            | Lightweight, fast, ideal for REST APIs                |
| Language       | JavaScript                           | Reliable for API logic and database queries         |
| ORM            | Prisma 5                            | Type-safe DB client, migration system, $transaction   |
| Auth           | jsonwebtoken + bcryptjs              | Stateless JWT-based auth, no sessions on server        |
| Validation     | Zod                                 | Schema-driven validation, shared with frontend        |
| Middleware     | Express middleware ecosystem         | CORS, body parsing, error handling, RBAC              |
5.2 Frontend (React SPA)
| Layer          | Technology                           | Rationale                                              |
|----------------|--------------------------------------|--------------------------------------------------------|
| Framework      | React 18 (Vite)                      | Fast dev server, lightweight SPA, no server-side logic |
| Language       | TypeScript                           | Type safety across component and hook layers           |
| Styling        | Tailwind CSS + shadcn/ui             | Rapid, accessible UI components                        |
| Routing        | React Router v6                      | Client-side navigation, nested routes                  |
| State / Data   | TanStack Query v5                    | Server-state caching, mutations, optimistic updates    |
| Forms          | React Hook Form + Zod                | Schema-driven validation, shared with API              |
5.3 Infrastructure
| Service         | Provider             | Plan        | Cost       |
|-----------------|----------------------|-------------|------------|
| Hosting (API)   | Railway / Render     | Free/paid   | $0-20      |
| Hosting (Frontend) | Netlify            | Free        | $0         |
| Database        | PostgreSQL (self-hosted or managed)| Free-Paid   | $0-50      |
| Connection Pool | pgBouncer or pgPool  | Included    | $0-10      |
| CI/CD           | GitHub Actions       | Free        | $0         |
5.4 Developer Tooling
| Tool            | Purpose                             |
|-----------------|-------------------------------------|
| Vite            | Fast build tool and dev server      |
| ESLint + Prettier | Linting and formatting            |
| Husky + lint-staged | Pre-commit hooks                |
| Vitest          | Unit tests                          |
| Playwright      | End-to-end tests                    |
| Prisma Studio   | Visual DB browser (dev only)        |
***6. Database Schema
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // bypasses PgBouncer for migrations
}
// ─── Auth ────────────────────────────────────────────────────────────────────
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hash
  role      Role     @default(CASHIER)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  sales          Sale[]
  stockMovements StockMovement[]
}
enum Role {
  OWNER
  CASHIER
  ADMIN
}
// ─── Products & Inventory ────────────────────────────────────────────────────
model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  products Product[]
}
model Product {
  id               String   @id @default(cuid())
  name             String
  barcode          String?  @unique
  sellingPrice     Decimal  @db.Decimal(10, 2)
  stock            Int      @default(0)
  lowStockThreshold Int     @default(5)
  categoryId       String
  deletedAt        DateTime? // soft delete
  category       Category        @relation(fields: [categoryId], references: [id])
  saleItems      SaleItem[]
  stockMovements StockMovement[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
model StockMovement {
  id          String        @id @default(cuid())
  productId   String
  userId      String
  type        MovementType
  quantity    Int           // positive = stock in, negative = stock out
  reason      String?
  referenceId String?       // saleId for SALE movements
  product   Product @relation(fields: [productId], references: [id])
  user      User    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
enum MovementType {
  PURCHASE    // stock received from supplier
  SALE        // stock reduced by sale
  ADJUSTMENT  // manual correction
  RETURN      // customer return
}
// ─── Sales ───────────────────────────────────────────────────────────────────
model Sale {
  id            String        @id @default(cuid())
  userId        String
  subtotal      Decimal       @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  note          String?
  createdAt     DateTime      @default(now())
  user      User       @relation(fields: [userId], references: [id])
  saleItems SaleItem[]
}
model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
  subtotal  Decimal @db.Decimal(10, 2)
  sale    Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
}
enum PaymentMethod {
  CASH
  CARD
  MOBILE_MONEY
}
***7. Prisma $transaction — Core Implementation
This is the most critical piece of the system. A sale must never be recorded without the matching stock decrement, and we must never allow stock to go negative.
7.1 Strategy: Interactive Transactions with Pessimistic Locking
We use Prisma's interactive transaction form ($transaction(async (tx) => { ... })) combined with a SELECT ... FOR UPDATE raw query to lock product rows for the duration of the transaction, preventing race conditions under concurrent sales.
// lib/services/sale.service.js
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
export async function createSale(payload, userId) {
  return await prisma.$transaction(async (tx) => {
    // ── Step 1: Lock & validate stock for every item ──────────────────────
    for (const item of payload.items) {
      // Raw query acquires a row-level lock until transaction commits/rolls back
      const rows = await tx.$queryRaw<Array<{ stock: number }>>(
        Prisma.sql`
          SELECT stock
          FROM "Product"
          WHERE id = ${item.productId}
            AND "deletedAt" IS NULL
          FOR UPDATE
        `
      );
      if (rows.length === 0) {
        throw new Error(`Product ${item.productId} not found.`);
      }
      if (rows[0].stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.productId}. ` +
          `Available: ${rows[0].stock}, Requested: ${item.quantity}.`
        );
      }
    }
    // ── Step 2: Calculate totals ──────────────────────────────────────────
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const total = subtotal;
    // ── Step 3: Persist the Sale ─────────────────────────────────────────
    const sale = await tx.sale.create({
      data: {
        userId,
        subtotal,
        total,
        paymentMethod: payload.paymentMethod,
        note: payload.note,
      },
    });
    // ── Step 4: Persist SaleItems, decrement stock, record movements ──────
    for (const item of payload.items) {
      // 4a. Create SaleItem
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
        },
      });
      // 4b. Decrement stock (atomic — no separate read/write race)
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      // 4c. Append audit trail
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          userId,
          type: "SALE",
          quantity: -item.quantity,   // negative = stock leaving
          referenceId: sale.id,
          reason: `Sale #${sale.id}`,
        },
      });
    }
    // ── Step 5: Return the full sale with items ───────────────────────────
    return tx.sale.findUniqueOrThrow({
      where: { id: sale.id },
      include: { saleItems: { include: { product: true } } },
    });
  }, {
    // Recommended timeout for POS transactions
    timeout: 10_000,             // 10 seconds max
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}
7.2 Why This Approach
| Concern                        | Solution                                                    |
|--------------------------------|-------------------------------------------------------------|
| Partial write (sale but no stock decrease) | Single $transaction — either all writes commit or none do |
| Race condition (two cashiers selling the last unit simultaneously) | SELECT ... FOR UPDATE locks the row; second transaction waits and then fails the stock check |
| Negative stock                 | Stock check runs inside the transaction after acquiring the lock |
| Deadlocks                      | Process items in deterministic order (sort by productId before looping) |
7.3 Deadlock Prevention (Important)
Always sort line items by productId before passing to createSale so two concurrent transactions always acquire locks in the same order:
// In the API route / caller:
const sortedItems = payload.items.sort((a, b) =>
  a.productId.localeCompare(b.productId)
);
await createSale({ ...payload, items: sortedItems }, session.user.id);
***8. API Route Design (Express Backend)
All routes are Express.js endpoints running on a separate Node.js server.
8.1 Endpoint Map
POST   /api/auth/login           — Login and return JWT token
POST   /api/auth/refresh         — Refresh JWT token
POST   /api/auth/logout          — Logout (frontend discards token)
GET    /api/products             — List products (with search & filter)
POST   /api/products             — Create product          [OWNER, ADMIN]
GET    /api/products/:id         — Get single product
PATCH  /api/products/:id         — Update product          [OWNER, ADMIN]
DELETE /api/products/:id         — Soft-delete product     [OWNER, ADMIN]
POST   /api/products/:id/adjust  — Manual stock adjustment [OWNER, ADMIN]
POST   /api/sales                — Create sale (runs $transaction)
GET    /api/sales                — List sales (paginated)
GET    /api/sales/:id            — Get sale detail + items
GET    /api/reports/summary      — Daily/weekly/monthly totals
GET    /api/reports/top-products — Best sellers
GET    /api/users                — List users              [OWNER, ADMIN]
POST   /api/users                — Create user             [OWNER, ADMIN]
PATCH  /api/users/:id            — Update user role/status [OWNER, ADMIN]
8.2 Standard Response Envelope
// Successful response
{
  "success": true,
  "data": { ... }
}
// Error response
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product abc123. Available: 2, Requested: 5."
  }
}
8.3 Authentication — JWT Bearer Token
All protected endpoints require an Authorization header with a Bearer token:
Authorization: Bearer <jwt_token>
The token is obtained from /api/auth/login using email and password.
Token is stored in localStorage on the frontend and included automatically via a fetch interceptor or Axios instance.
Tokens expire after 8 days; the frontend calls /api/auth/refresh to get a new one.
8.4 Validation Pattern
Zod schemas are defined once in a shared /lib/validators directory and imported in the backend API routes:
// backend/src/lib/validators/sale.validator.js
import { z } from "zod";
export const SaleItemSchema = z.object({
  productId: z.string().cuid(),
  quantity:  z.number().int().positive(),
  unitPrice: z.number().positive(),
});
export const SalePayloadSchema = z.object({
  items:         z.array(SaleItemSchema).min(1),
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE_MONEY"]),
  note:          z.string().max(500).optional(),
});
The frontend also imports these same schemas for form validation.
***9. Frontend Architecture (React + Vite)
The frontend is a separate React SPA that communicates with the Express backend via REST API calls.
9.1 Page / Route Map (React Router)
/login                         — Login page (public)
/dashboard                     — Owner summary (remote view)  [OWNER]
  /dashboard/sales             — Sales list + filter
  /dashboard/sales/:id         — Sale detail / receipt
  /dashboard/inventory         — Stock levels, low-stock alerts
  /dashboard/inventory/:id     — Product detail + movement history
  /dashboard/reports           — Charts and export
  /dashboard/users             — User management
/pos                           — POS terminal (cashier view)  [CASHIER, OWNER]
9.2 Component Structure
src/
  components/
    ui/               # shadcn/ui primitives
    layout/
      Sidebar.tsx
      Topbar.tsx
      ProtectedRoute.tsx   # Wraps protected routes, checks stored role
    pos/
      ProductSearch.tsx
      CartItem.tsx
      Cart.tsx
      CheckoutModal.tsx
    inventory/
      ProductTable.tsx
      StockBadge.tsx
      AdjustStockDialog.tsx
    reports/
      SummaryCard.tsx
      SalesChart.tsx       # Recharts
      TopProductsTable.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    POSPage.tsx
    ...etc
  hooks/
    useAuth.ts         # Auth context hook
    useCreateSale.ts
    useProducts.ts
    ...etc
  lib/
    api.ts             # Fetch client with JWT interceptor
    validators/        # Shared Zod schemas
    constants.ts
  App.tsx
  main.tsx
  index.css
9.3 Data Fetching Pattern
All server-state lives in TanStack Query. Mutations call the Express API and invalidate relevant cache keys on success.
// src/hooks/useCreateSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SalePayloadSchema } from "@/lib/validators/sale.validator";
export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalePayloadSchema) =>
      api.post("/sales", payload),
    onSuccess: () => {
      // Invalidate both sales list and inventory (stock changed)
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
9.4 Authentication on Frontend
After login, the JWT token is stored in localStorage.
A custom fetch wrapper (or Axios instance) automatically adds the token to all API requests:
// src/lib/api.ts
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default api;
***10. Project Structure (Monorepo with separate backend & frontend)
The project is organized as a monorepo with two independent applications sharing the Prisma schema.
The backend is implemented in JavaScript, while the frontend is implemented in TypeScript.
pos-inventory/
pos-inventory/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /api/auth/login, /refresh, /logout
│   │   │   ├── products.js     # GET/POST/PATCH/DELETE /api/products
│   │   │   ├── sales.js        # POST/GET /api/sales (with transaction)
│   │   │   ├── reports.js      # GET /api/reports/summary, top-products
│   │   │   ├── users.js        # GET/POST/PATCH/DELETE /api/users
│   │   │   └── shifts.js       # POST /api/shifts/end, GET /api/shifts/report
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification middleware
│   │   │   ├── rbac.js         # Role-based access control
│   │   │   └── errorHandler.js # Global error handling
│   │   ├── lib/
│   │   │   ├── prisma.js       # Singleton Prisma client
│   │   │   ├── auth.js         # JWT creation/verification
│   │   │   ├── validators/
│   │   │   │   ├── sale.validator.js
│   │   │   │   └── product.validator.js
│   │   │   └── services/
│   │   │       ├── sale.service.js  # createSale with transaction
│   │   │       └── product.service.js
│   │   ├── app.js              # Express app setup
│   │   └── index.js            # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Shared database schema
│   │   ├── seed.js             # Dev seed data
│   │   └── migrations/
│   ├── tests/
│   │   ├── unit/
│   │   │   └── sale.service.test.js
│   │   └── e2e/
│   │       └── checkout.spec.js
│   ├── .env.example
│   ├── .env                    # Git-ignored
│   ├── package.json
│   └── jsconfig.json
│
├── frontend/                   # React + Vite PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Topbar.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── pos/
│   │   │   │   ├── QRScanner/
│   │   │   │   │   ├── QRScanner.tsx
│   │   │   │   │   ├── CameraSelector.tsx
│   │   │   │   │   └── PermissionRequest.tsx
│   │   │   │   └── Receipt.tsx
│   │   │   └── inventory/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── POSPage.tsx
│   │   │   ├── ShiftHandoverPage.tsx
│   │   │   ├── CashierLoginPage.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCreateSale.ts
│   │   │   ├── useProducts.ts
│   │   │   ├── useOfflineSale.ts
│   │   │   ├── useSyncStatus.ts
│   │   │   └── usePrinter.ts
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios instance with JWT interceptor
│   │   │   ├── validators/     # Shared Zod schemas
│   │   │   ├── constants.ts
│   │   │   ├── db/
│   │   │   │   ├── index.ts    # Dexie database setup
│   │   │   │   ├── schemas.ts  # Local tables: sales, products, syncQueue
│   │   │   │   └── migrations.ts
│   │   │   ├── sync/
│   │   │   │   ├── syncEngine.ts
│   │   │   │   ├── conflictResolver.ts
│   │   │   │   └── backgroundSync.ts
│   │   │   └── printing/
│   │   │       ├── receiptTemplate.ts
│   │   │       ├── printManager.ts
│   │   │       └── bluetoothPrinter.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pwa/
│   │   │   └── registerSW.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   ├── manifest.json
│   │   └── offline.html
│   ├── tests/
│   │   └── ...e2e tests
│   ├── .env.example
│   ├── .env                    # Git-ignored
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/                     # Shared Prisma schema (symlinked from backend)
│   ├── schema.prisma
│   └── migrations/
│
├── .gitignore
└── README.md
***11. Backend Middleware — Authentication & RBAC
// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ success: false, error: "No token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
}
// backend/src/middleware/rbac.js
const ROLE_MAP = {
  "POST /api/products":  ["OWNER", "ADMIN"],
  "PATCH /api/products/:id": ["OWNER", "ADMIN"],
  "DELETE /api/products/:id": ["OWNER", "ADMIN"],
  "POST /api/products/:id/adjust": ["OWNER", "ADMIN"],
  "GET /api/users": ["OWNER", "ADMIN"],
  "POST /api/users": ["OWNER", "ADMIN"],
  "PATCH /api/users/:id": ["OWNER", "ADMIN"],
  "GET /api/reports": ["OWNER", "ADMIN"],
};
export function rbacMiddleware(route, allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
  };
}
***12. Environment Variables
12.1 Backend (.env)
# backend/.env.example
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"
# JWT Authentication
JWT_SECRET="your-secret-key-min-32-characters"
JWT_EXPIRY="8h"
# Server
NODE_ENV="development"
PORT=3001
# CORS (Frontend URL)
CORS_ORIGIN="http://localhost:5173"    # Vite dev server
12.2 Frontend (.env)
# frontend/.env.example
VITE_API_URL=http://localhost:3001
VITE_APP_NAME="My Store POS"
> Note: VITE_* variables are prefixed with VITE_ to be accessible at runtime.
> DATABASE_URL uses port 6543 (PgBouncer/transaction pooling) for runtime queries. 
> DIRECT_URL uses port 5432 (direct) for Prisma migrations, run from backend only.
***13. DevOps & Deployment
13.1 Local Development
# Terminal 1: Start the Express backend
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev        # Runs on http://localhost:3001
# Terminal 2: Start the React frontend
cd frontend
npm install
cp .env.example .env
npm run dev        # Runs on http://localhost:5173 (Vite dev server)
# Terminal 3 (optional): Open Prisma Studio for DB browsing
cd backend
npx prisma studio
13.2 Build for Production
# Backend
cd backend
npm run build      # Compiles TypeScript to dist/
# Frontend
cd frontend
npm run build      # Creates dist/ folder with static assets
13.3 CI/CD Pipeline — GitHub Actions
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
  e2e:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm --prefix backend install
      - run: npm --prefix frontend install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
13.4 Deployment Strategy
Backend:
Deploy to Railway or Render as a Docker container
Set environment variables in the deployment platform
Run migrations before starting the server (manual step or pre-start script)
Frontend:
Deploy to Netlify or another static hosting service
Point VITE_API_URL to the production backend URL
Database:
Host PostgreSQL database on a managed provider (AWS RDS, DigitalOcean, etc.) or self-hosted
Configure connection pooling with pgBouncer or pgPool
Set up backup automation and monitoring
13.5 Docker Setup (Optional for Backend)
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
***14. Testing Strategy
14.1 Backend Unit Tests — Sale Service (Critical Path)
// backend/tests/unit/sale.service.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSale } from "@/lib/services/sale.service";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn) => fn(mockTx)),
  },
}));
describe("createSale", () => {
  it("throws INSUFFICIENT_STOCK when stock is too low", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ stock: 1 }]);
    const payload = {
      items: [{ productId: "prod_1", quantity: 5, unitPrice: 10 }],
      paymentMethod: "CASH" as const,
    };
    await expect(createSale(payload, "user_1")).rejects.toThrow(
      "Insufficient stock"
    );
  });
  it("creates sale, items, and stock movements atomically", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ stock: 10 }]);
    mockTx.sale.create.mockResolvedValue({ id: "sale_1" });
    
    await createSale(payload, "user_1");
    
    expect(mockTx.product.update).toHaveBeenCalledWith({
      where: { id: "prod_1" },
      data: { stock: { decrement: 5 } },
    });
    expect(mockTx.stockMovement.create).toHaveBeenCalled();
  });
});
14.2 Frontend Integration Tests
// frontend/tests/e2e/checkout.spec.ts
import { test, expect } from "@playwright/test";
test("cashier can complete a sale", async ({ page }) => {
  await page.goto("http://localhost:5173/login");
  await page.getByLabel("Email").fill("cashier@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign In" }).click();
  
  await page.goto("http://localhost:5173/pos");
  await page.getByPlaceholder("Search product...").fill("Widget A");
  await page.getByText("Widget A").click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByRole("button", { name: "Confirm Sale" }).click();
  
  await expect(page.getByText("Sale recorded successfully")).toBeVisible();
});
***15. Security Checklist
Backend API:
✓ All routes verify JWT token (authMiddleware)
✓ All mutations check role via RBAC middleware
✓ All user input validated with Zod before reaching DB
✓ Prisma parameterized queries prevent SQL injection
✓ Passwords hashed with bcrypt (min 12 rounds)
✓ JWT_SECRET is a 32-byte random value, never committed to git
✓ .env is in .gitignore
✓ CORS configured to only allow frontend origin
✓ Error responses don't leak database details

Frontend SPA:
✓ Token stored in localStorage (XSS-protected by httpOnly not applicable in SPA)
✓ Sensitive routes wrapped in ProtectedRoute component
✓ API calls include Authorization header automatically
✓ Login/logout handled via dedicated API endpoints
✓ No sensitive data (passwords) sent in localStorage

Database:
✓ Row Level Security (RLS) policies enabled as defense-in-depth
✓ Soft-delete products (never hard-delete sales history)
✓ Connection pooling (pgBouncer/pgPool) prevents connection exhaustion
✓ Regular backups configured and tested
***16. Milestones & Suggested Build Order (PERN Stack)
| Phase | Milestone                                              | Est. Time |
|-------|--------------------------------------------------------|-----------|
| 1     | Monorepo scaffold, Prisma schema, DB connection        | 1 day     |
| 2     | Backend setup (Express, JWT auth, RBAC middleware)     | 1 day     |
| 3     | Frontend setup (Vite + React Router, Auth context)     | 1 day     |
| 4     | Product API (GET/POST/PATCH/DELETE) + frontend table   | 2 days    |
| 5     | POS terminal UI (cart, product search)                 | 2 days    |
| 6     | Sale service with $transaction + checkout API          | 2 days    |
| 7     | Login page + JWT token management                      | 1 day     |
| 8     | Owner dashboard (remote view, summary tiles)           | 2 days    |
| 9     | Reports (charts, CSV export)                           | 2 days    |
| 10    | CI/CD pipeline setup + backend/frontend deployment     | 1 day     |
| 11    | Testing (unit & e2e), hardening, bug fixes             | 2 days    |
| **Total** |                                                   | **~17 days** |
***17. Key Decisions Log
| Decision | Chosen Option | Alternatives Considered | Reason |
|----------|---------------|-------------------------|--------|
| Stack | PERN (PostgreSQL + Express + React + Node) | Monolithic alternatives | Clear separation of concerns; backend is truly stateless and scalable; frontend can be cached independently |
| Auth | JWT tokens | Sessions with cookies | Stateless, easier to scale horizontally; standard for REST APIs |
| Frontend Framework | React 18 + Vite | Vue, Svelte | Popular, large ecosystem, Vite is lightning-fast for dev |
| Frontend Router | React Router v6 | TanStack Router, Remix | Industry standard, mature, good docs |
| Database | PostgreSQL with Prisma | MySQL, SQLite | ACID transactions, FOR UPDATE support, mature ecosystem, excellent Prisma support |
| Deployment (Backend) | Railway or Render | AWS, Heroku, DIY VPS | Free tier generous, one-click deploys, no DevOps headache |
| Deployment (Frontend) | Netlify | AWS S3 + CloudFront, Railway | Optimized for static sites, instant cache invalidation, free tier |
| Transaction strategy | Interactive $transaction + FOR UPDATE | Sequential queries, optimistic locking | Only approach preventing race conditions under concurrent load |
| Cost Model | Free-to-paid | Full upfront SaaS license | Starts at $0, scales as needed; aligns with growth |
***18. Example: Auth Flow (PERN)
18.1 Login Flow
Frontend:
```
POST /api/auth/login
{
  "email": "owner@example.com",
  "password": "secret123"
}
```
Backend Response:
```
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "owner@example.com",
      "role": "OWNER"
    }
  }
}
```
Frontend stores token in localStorage and includes it in all subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
18.2 Protected Request
Frontend:
```
GET /api/dashboard/summary
Header: Authorization: Bearer <token>
```
Backend Middleware Chain:
1. authMiddleware verifies JWT signature and extracts user ID
2. rbacMiddleware checks that user.role includes "OWNER"
3. Route handler executes (no risk of unauthorized access)
18.3 Token Refresh
When token expires (8 hours):
```
POST /api/auth/refresh
Header: Authorization: Bearer <expired_token>
```
Backend returns a new token. Frontend updates localStorage and continues seamlessly.