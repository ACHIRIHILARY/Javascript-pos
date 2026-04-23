# Frontend Specification: POS & Inventory Management System
Version: 1.0.0  
Date: 2026-04-23  
Status: Ready for implementation  
Audience: AI agent or engineer building the complete frontend against the existing backend

## 1) Purpose and scope
Build a production-ready React frontend for the POS and inventory platform, aligned with:
- business requirements in `speck.md`
- currently implemented backend contract in `README.md`
- API examples in `postman/javascript-pos-backend.postman_collection.json`

This document is implementation-oriented and should be treated as the execution source of truth for frontend work.

## 2) Hard constraints
- Frontend stack:
  - React 18
  - TypeScript
  - Vite
  - React Router v6
  - TanStack Query v5
  - React Hook Form + Zod
  - Tailwind CSS + shadcn/ui
- API integration:
  - all requests must target `/api/v1/*` (except `GET /api/health`)
  - auth via `Authorization: Bearer <token>`
  - standard API envelope:
    - success: `{ success: true, data: ... }`
    - error: `{ success: false, error: { code, message } }`
- Must support role-aware UX for:
  - OWNER
  - ADMIN
  - CASHIER
- Must be responsive (mobile + desktop), with POS usability prioritized for tablet/desktop.

## 3) Backend contract to integrate
Base URL (dev): `http://localhost:3001`

### Health
- `GET /api/health`

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
- `POST /api/v1/products/import` (OWNER/ADMIN, text/csv body)
- `GET /api/v1/products/export/csv` (OWNER/ADMIN)

### Sales
- `POST /api/v1/sales`
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

## 4) Non-functional frontend requirements
- Perceived performance:
  - initial page shell under ~2s on normal 4G
  - route transitions instant where possible
- Reliability:
  - robust API error handling and retry strategy
  - no blank screens on API failures
- Security:
  - never log token in console
  - clear token on logout and on repeated 401
  - role-based route guarding
- Accessibility:
  - keyboard navigable forms, dialogs, tables
  - proper labels and aria attributes on critical controls

## 5) Frontend app architecture
Use a feature-first structure while keeping reusable UI foundations separated.

Proposed folder layout:

```
frontend/
  src/
    app/
      router.tsx
      providers.tsx
      queryClient.ts
    lib/
      api/
        client.ts
        endpoints.ts
        error.ts
      auth/
        tokenStorage.ts
        session.ts
      validators/
        auth.ts
        products.ts
        sales.ts
        users.ts
      utils/
        currency.ts
        datetime.ts
        csv.ts
        download.ts
      constants.ts
      types/
        api.ts
        auth.ts
        domain.ts
    features/
      auth/
        api.ts
        hooks.ts
        components/
      dashboard/
        api.ts
        hooks.ts
        components/
      products/
        api.ts
        hooks.ts
        components/
      sales/
        api.ts
        hooks.ts
        components/
      reports/
        api.ts
        hooks.ts
        components/
      users/
        api.ts
        hooks.ts
        components/
      shifts/
        api.ts
        hooks.ts
        components/
    components/
      layout/
        AppShell.tsx
        Sidebar.tsx
        Topbar.tsx
      guards/
        ProtectedRoute.tsx
        RoleGuard.tsx
      ui/
        ...shadcn components...
    pages/
      LoginPage.tsx
      DashboardPage.tsx
      POSPage.tsx
      InventoryPage.tsx
      ProductDetailPage.tsx
      SalesPage.tsx
      SaleDetailPage.tsx
      ReportsPage.tsx
      UsersPage.tsx
      ShiftHandoverPage.tsx
      NotFoundPage.tsx
    pwa/
      registerSW.ts
    main.tsx
    index.css
```

## 6) Routing and navigation model
Public:
- `/login`

Protected app shell:
- `/dashboard` (OWNER/ADMIN summary)
- `/dashboard/inventory` (OWNER/ADMIN)
- `/dashboard/inventory/:id` (OWNER/ADMIN)
- `/dashboard/sales` (OWNER/ADMIN, cashier can be optionally restricted to own sales view)
- `/dashboard/sales/:id` (OWNER/ADMIN/CASHIER if allowed)
- `/dashboard/reports` (OWNER/ADMIN)
- `/dashboard/users` (OWNER/ADMIN)
- `/dashboard/shifts` (OWNER/ADMIN/CASHIER with role-filtered UI)
- `/pos` (CASHIER/OWNER/ADMIN)

Fallback:
- `* -> NotFoundPage`

## 7) Authentication and session handling
### Login flow
1. submit email/password to `POST /api/v1/auth/login`
2. store token in localStorage
3. store lightweight user profile (id, role, email, name)
4. redirect by role:
   - OWNER/ADMIN -> `/dashboard`
   - CASHIER -> `/pos`

### Request auth
- Attach token through Axios interceptor.

### 401 handling
- On first 401: attempt `POST /api/v1/auth/refresh`.
- If refresh succeeds: retry original request once.
- If refresh fails: clear session and redirect `/login`.

### Logout
- call `/api/v1/auth/logout` (best-effort)
- clear local session regardless of API result

## 8) Data access and caching strategy
Use TanStack Query keys:
- `["auth","me"]`
- `["categories"]`
- `["products", filters]`
- `["product", id]`
- `["sales", page, limit]`
- `["sale", id]`
- `["reports","summary", period]`
- `["reports","top-products"]`
- `["users"]`
- `["shifts","report", from, to]`

Mutation invalidation rules:
- create/update/delete product -> invalidate `products`, `product`, `reports summary`
- stock adjust -> invalidate `products`, `product`, `reports summary`
- create sale -> invalidate `sales`, `products`, `reports summary`, `reports top-products`
- create/update user -> invalidate `users`
- end shift -> invalidate `shifts report`

## 9) Domain UI specifications by feature
## 9.1 Login
- fields: email, password
- validation: email format, password min length
- on error: display backend message from error envelope

## 9.2 Dashboard (OWNER/ADMIN)
Display:
- today revenue (summary endpoint period=day)
- number of sales today
- low stock products count
- quick links: Inventory, POS, Reports, Users

## 9.3 POS (CASHIER-first)
Core modules:
- product search by name/barcode
- product selection list with stock indicator
- cart with editable quantities
- payment method selector: CASH/CARD/MOBILE_MONEY
- checkout action posts to `/api/v1/sales`

Behavior:
- prevent zero/negative qty in cart
- show clear insufficient stock errors from backend
- after success:
  - clear cart
  - show printable receipt preview modal
  - offer print (window print) and download html

## 9.4 Inventory / Products
List page:
- filters:
  - text search
  - category
  - low-stock toggle
- columns: name, barcode, category, price, stock, threshold, updated date
- row actions: view details, edit, adjust stock, soft delete

Create/Edit:
- fields:
  - name
  - barcode (optional)
  - categoryId
  - sellingPrice
  - stock
  - lowStockThreshold

Details page:
- product metadata
- stock movement history (`stockMovements` from product detail endpoint)

CSV operations:
- import:
  - upload `.csv`
  - parse and send raw csv text with `Content-Type: text/csv`
  - show import result count
- export:
  - call `/api/v1/products/export/csv`
  - trigger file download

## 9.5 Sales history
- paginated table from `/api/v1/sales?page=&limit=`
- columns: sale id, date, cashier, payment method, total
- detail page from `/api/v1/sales/:id`:
  - line items
  - totals
  - customer note
  - receipt print/download actions

## 9.6 Reports
Summary tab:
- period toggle day/week/month
- KPI cards from `reports/summary`

Top products tab:
- table from `reports/top-products`

Export tab:
- summary csv export via `reports/summary/export/csv?period=...`

Charts:
- revenue trend chart (derived from summary/sales data if API lacks time-series endpoint)
- top products bar chart

## 9.7 Users (OWNER/ADMIN)
- users list
- create user (name/email/password/role)
- update user (name/role/active)
- disable destructive actions for current signed-in owner account (UX safety)

## 9.8 Shifts
- End shift page:
  - optional cashier selector (OWNER/ADMIN)
  - date window controls
  - submit to `/api/v1/shifts/end`
  - render totals and transaction snapshot
- Shift report page:
  - date range
  - call `/api/v1/shifts/report`
  - group cards/table by cashier

## 10) UI/UX and design system requirements
- Use shadcn/ui primitives for consistency:
  - Button, Input, Select, Dialog, Drawer, Table, Badge, Toast, Tabs
- Theme:
  - neutral admin shell + high-contrast POS controls
- POS ergonomics:
  - large tap targets
  - sticky cart summary and checkout bar
  - quick qty increment/decrement buttons
- Empty states and loading:
  - every data view must support loading, empty, and error states

## 11) Error and feedback handling
- Centralize API error mapping:
  - fallback message: `Something went wrong. Please try again.`
  - use backend `error.code` for specific user guidance:
    - `INSUFFICIENT_STOCK`
    - `INVALID_CREDENTIALS`
    - `FORBIDDEN`
    - `VALIDATION_ERROR`
- Global toasts for mutation results
- Inline field errors for form validation issues

## 12) Type definitions (minimum)
Define TS domain models:
- `User`, `Role`
- `Category`
- `Product`
- `StockMovement`
- `Sale`, `SaleItem`, `PaymentMethod`
- `ReportSummary`
- API envelopes:
  - `ApiSuccess<T>`
  - `ApiError`

## 13) Environment and config for frontend
`frontend/.env.example` should include:
- `VITE_API_URL=http://localhost:3001`
- `VITE_APP_NAME=My Store POS`

Runtime config:
- API base URL should be `VITE_API_URL` + `/api/v1` for business routes
- health check can hit `/api/health`

## 14) Build phases and deliverables
## Phase 1: Foundation
Deliver:
- Vite + React + TypeScript app
- Tailwind + shadcn setup
- router skeleton + protected route guards
- axios client with auth interceptor and refresh logic

Acceptance:
- can login and navigate protected routes by role

## Phase 2: Core POS + Inventory
Deliver:
- POS workflow end-to-end
- products CRUD + adjust stock + category integration
- product detail with stock movement timeline

Acceptance:
- cashier can complete sale
- owner can manage inventory

## Phase 3: Reports + Users + Shifts
Deliver:
- reports summary/top-products/csv export
- users management screens
- shift end and shift report pages

Acceptance:
- owner can run all managerial flows without Postman

## Phase 4: Production polish
Deliver:
- responsive refinement
- accessibility fixes
- loading/error state audit
- test suite expansion and CI-ready scripts

Acceptance:
- app is stable for staging rollout

## 15) Testing strategy (frontend)
Unit/component (Vitest + Testing Library):
- auth form validation
- role guard behavior
- cart calculations
- table filtering logic

Integration:
- API hooks with mocked responses
- token refresh path

E2E (Playwright):
- owner login -> create category -> create product -> adjust stock -> sale -> report
- cashier login -> POS checkout -> shift end

## 16) Definition of done
Frontend is considered complete when:
1. all routes/pages in this doc are implemented
2. all existing backend endpoints used by frontend have wired UI actions
3. auth + RBAC UX is enforced on client-side routes
4. critical flows pass manual QA:
   - owner management flow
   - cashier checkout flow
   - reporting/export flow
5. test suite includes:
   - baseline unit tests
   - at least 2 full e2e happy paths

## 17) Immediate implementation checklist for the next AI agent
1. scaffold `frontend/` with React + TypeScript + Vite.
2. implement `lib/api/client.ts` with auth and refresh interceptors.
3. implement auth pages/context and protected route shell.
4. implement categories/products modules first (needed by POS).
5. implement POS checkout against `/api/v1/sales`.
6. implement reports/users/shifts modules.
7. add CSV import/export UX.
8. add tests and final polish.
