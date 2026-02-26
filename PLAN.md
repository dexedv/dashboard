# Dashboard Suite - Project Plan

## Project Overview
- **Name**: Dashboard Suite
- **Type**: Full-stack Web Application (Monorepo)
- **Purpose**: Productivity dashboard with Notes, Calendar, CRM (Customers/Orders), File Storage, and Spotify integration
- **Target Users**: Small business owners, freelancers, teams needing integrated workflow management

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | TailwindCSS + shadcn/ui |
| State | TanStack Query v5 + Zod |
| Routing | React Router v6 |
| Backend | Node.js + Fastify + TypeScript |
| Database | SQLite + Prisma ORM |
| Auth | JWT + Argon2 password hashing |
| File Upload | Fastify multipart + local storage |
| Spotify | Spotify Web API + Web Playback SDK |
| Logging | Pino |
| Testing | Vitest |
| Linting | ESLint + Prettier |

## Architecture - Monorepo Structure
```
/dashboard-suite
├── apps/
│   ├── web/          (React frontend)
│   └── api/          (Fastify backend)
├── packages/
│   └── shared/       (Zod schemas, types, utilities)
├── prisma/
│   └── schema.prisma
├── data/             (SQLite DB + uploads - .gitignore)
├── package.json      (root pnpm workspace)
├── pnpm-workspace.yaml
├── turbo.json        (optional, for caching)
└── .env.example
```

## Database Schema (Prisma)

### Models
- **User**: id, email, passwordHash, name, role (ADMIN/USER), active, createdAt, updatedAt
- **Note**: id, userId, title, content, tags (JSON), pinned, createdAt, updatedAt
- **CalendarEvent**: id, userId, title, description, location, startAt, endAt, reminderMinutes, createdAt, updatedAt
- **Customer**: id, userId, name, email, phone, address, notes, createdAt, updatedAt
- **Order**: id, customerId, title, description, status (NEW/IN_PROGRESS/WAITING_MATERIAL/DONE/SHIPPED/CANCELED), dueDate, promisedDeliveryDate, createdAt, updatedAt
- **OrderEvent**: id, orderId, type, note, createdAt
- **File**: id, ownerUserId, customerId (nullable), orderId (nullable), filename, originalName, mimeType, size, path, createdAt
- **SpotifyToken**: id, userId, accessToken, refreshToken, expiresAt, createdAt, updatedAt
- **RefreshToken**: id, userId, token, expiresAt, createdAt

## API Endpoints

### Auth
- POST /auth/register - Register new user (admin only)
- POST /auth/login - Login with email/password
- POST /auth/refresh - Refresh access token
- POST /auth/logout - Invalidate refresh token

### Users (Admin only)
- GET /users - List all users
- PATCH /users/:id - Update user (role, active)
- DELETE /users/:id - Deactivate user

### Notes
- GET /notes - List user's notes (with search/tags filter)
- POST /notes - Create note
- GET /notes/:id - Get single note
- PUT /notes/:id - Update note
- DELETE /notes/:id - Delete note
- PATCH /notes/:id/pin - Toggle pin

### Calendar
- GET /calendar/events - List events (with date range)
- POST /calendar/events - Create event
- GET /calendar/events/:id - Get single event
- PUT /calendar/events/:id - Update event
- DELETE /calendar/events/:id - Delete event

### Customers
- GET /customers - List customer's
- POST /customers - Create customer
- GET /customers/:id - Get customer with orders
- PUT /customers/:id - Update customer
- DELETE /customers/:id - Delete customer

### Orders
- GET /orders - List orders (with filters)
- POST /orders - Create order
- GET /orders/:id - Get order with events/history
- PUT /orders/:id - Update order
- DELETE /orders/:id - Delete order
- POST /orders/:id/events - Add order event

### Files
- GET /files - List files (with filters)
- POST /files - Upload file
- GET /files/:id - Download file
- DELETE /files/:id - Delete file

### Spotify
- GET /spotify/auth - Start OAuth flow
- GET /spotify/callback - OAuth callback
- GET /spotify/playlists - Get user playlists
- GET /spotify/search - Search tracks/artists
- POST /spotify/play - Play track (Web Playback SDK)
- GET /spotify/me - Get Spotify account info

## Frontend Pages/Routes
- /login - Login page
- /register - Register (admin only)
- /app - Main layout (protected)
  - /app/notes - Notes list + editor
  - /app/calendar - Calendar view
  - /app/customers - Customer list
  - /app/customers/:id - Customer detail + orders
  - /app/orders/:id - Order detail + history
  - /app/files - File browser
  - /app/spotify - Spotify integration
  - /app/admin/users - User management (admin)

## Implementation Phases

### Phase 1: Project Setup (Day 1)
1. Initialize pnpm workspace + monorepo structure
2. Configure TypeScript, ESLint, Prettier
3. Setup Prisma schema + migrations
4. Create .env.example
5. Setup Fastify backend with logging
6. Setup React frontend with Vite + Tailwind + shadcn/ui

### Phase 2: Authentication (Day 2)
1. Implement JWT + Refresh Token auth
2. Create auth middleware
3. Build login/register pages
4. Implement protected routes
5. Add role-based access control

### Phase 3: Notes Module (Day 3)
1. CRUD API endpoints
2. Notes list + editor UI
3. Search + tag filtering
4. Pin functionality

### Phase 4: Calendar Module (Day 4)
1. CRUD API endpoints
2. Calendar UI (month view + day list)
3. Event creation dialog
4. Reminder notifications

### Phase 5: Customers + Orders (Day 5-6)
1. Customer CRUD
2. Order CRUD + status management
3. Order history/events
4. Customer detail view with orders
5. Filters + search

### Phase 6: File Storage (Day 7)
1. File upload endpoint (multipart)
2. Drag & drop upload UI
3. File listing per customer/order
4. Download functionality

### Phase 7: Spotify Integration (Day 8)
1. OAuth flow setup
2. Playlist fetching
3. Track search
4. Playback (Web Playback SDK + fallback)

### Phase 8: Admin & Polish (Day 9)
1. User management UI
2. Admin role protection
3. Error handling + toasts
4. Loading states
5. README + documentation

## Security Measures
- Rate limiting on /auth/login (5 requests/minute)
- CORS configured for web origin only
- Input validation with Zod on all endpoints
- Password minimum 10 characters
- JWT access tokens (15 min) + refresh tokens (7 days)
- Refresh token rotation
- Role checks on admin routes

## Acceptance Criteria
- [ ] Monorepo builds without errors
- [ ] All API endpoints return proper responses
- [ ] Frontend loads without console errors
- [ ] Authentication flow works (login/logout/refresh)
- [ ] Notes CRUD + search + tags + pin work
- [ ] Calendar CRUD + views work
- [ ] Customer + Order CRUD + history work
- [ ] File upload + download works
- [ ] Spotify OAuth + playlists + search work
- [ ] Admin can manage users
- [ ] All pages are protected (except login)
