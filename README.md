# Dashboard Suite

A comprehensive full-stack productivity dashboard with Notes, Calendar, CRM (Customers/Orders), File Storage, and Spotify integration.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui components
- **State**: TanStack Query (React Query) + Zod
- **Routing**: React Router v6
- **Backend**: Node.js + Fastify + TypeScript
- **Database**: SQLite + Prisma ORM
- **Auth**: JWT + Argon2 password hashing
- **File Upload**: Fastify multipart
- **Spotify**: Spotify Web API + OAuth

## Project Structure

```
dashboard-suite
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Fastify API
├── packages/
│   └── shared/       # Zod schemas, types
├── prisma/
│   └── schema.prisma # Database schema
├── data/             # SQLite DB + uploads (gitignore)
├── package.json      # pnpm workspace root
└── pnpm-workspace.yaml
```

## Setup

### 1. Install pnpm (if not already)

```bash
npm install -g pnpm
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` - SQLite database path
- `JWT_ACCESS_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)
- `ARGON2_SECRET` - Argon2 hashing secret
- `SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app client secret
- `SPOTIFY_REDIRECT_URI` - OAuth callback URL

### 4. Generate Prisma Client & Database

```bash
pnpm db:generate
pnpm db:push
```

Or with migration:
```bash
pnpm db:migrate
```

### 5. Seed database (optional - creates admin user)

```bash
pnpm db:seed
```

Default admin:
- Email: `admin@dashboard.local`
- Password: `admin123456`

## Development

### Run both API and Web concurrently

```bash
pnpm dev
```

This starts:
- API: http://localhost:3001
- Web: http://localhost:5173

### Run separately

```bash
# API only
cd apps/api
pnpm dev

# Web only
cd apps/web
pnpm dev
```

## Build

```bash
pnpm build
```

## Features

### Notes
- Create, edit, delete notes
- Markdown support
- Tags
- Pin important notes
- Search

### Calendar
- Month view
- Create/edit events
- Reminders
- Location support

### Customers & Orders
- Customer management
- Order tracking with status
- Order history/events
- Due date tracking

### File Storage
- Drag & drop upload
- File organization by customer/order
- Download files

### Spotify
- OAuth connection
- View playlists
- Search tracks
- Play (opens in Spotify)

### User Management (Admin)
- Create users
- Role management (admin/user)
- Activate/deactivate users

## API Endpoints

- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Current user
- `GET/POST /users` - User management (admin)
- `GET/POST/PUT/DELETE /notes` - Notes CRUD
- `GET/POST/PUT/DELETE /calendar/events` - Calendar events
- `GET/POST/PUT/DELETE /customers` - Customers
- `GET/POST/PUT/DELETE /orders` - Orders
- `GET/POST/DELETE /files` - File management
- `GET /spotify/*` - Spotify integration

## Security

- JWT access tokens (15 min expiry)
- Refresh token rotation (7 days)
- Argon2 password hashing
- Rate limiting on auth endpoints
- Role-based access control
- Input validation with Zod

## License

MIT
