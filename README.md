# Enterprise WiFi Voucher Platform

A comprehensive management system for WiFi vouchers and hotspot access.

## Features

- **Voucher Management**: Create and manage WiFi vouchers
- **Package Management**: Define different data packages
- **Router Management**: Connect and manage multiple routers
- **Payment Processing**: Track and manage transactions
- **Dashboard**: Real-time analytics and statistics
- **User Management**: Role-based access control
- **Audit Logging**: Track all system activities

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/kelgralich1122/Wifi-voucher-.git
cd Wifi-voucher-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the variables in `.env.local`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/app_db"
JWT_SECRET="your-secret-key-min-32-chars-for-production"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Setup PostgreSQL Database

Create the database:

```bash
createdb app_db
```

### 5. Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. Create Initial Admin User (Optional)

Connect to your database and insert an admin user:

```sql
INSERT INTO companies (id, name, slug, contact_email, created_at)
VALUES ('company-1', 'Demo Company', 'demo-company', 'admin@demo.com', NOW());

INSERT INTO users (id, company_id, name, email, password, role, is_active, created_at)
VALUES ('user-1', 'company-1', 'Admin User', 'admin@example.com', '$2a$10$...', 'admin', true, NOW());
```

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login

- **Email**: admin@example.com
- **Password**: password123 (after creating user above)

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication
│   │   ├── packages/       # Package management
│   │   ├── routers/        # Router management
│   │   ├── vouchers/       # Voucher generation
│   │   └── portal/         # Public portal
│   ├── dashboard/          # Dashboard pages
│   │   ├── packages/       # Package management UI
│   │   ├── routers/        # Router management UI
│   │   ├── payments/       # Payment history
│   │   └── settings/       # Settings
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Database schema
├── lib/
│   ├── auth.ts             # Authentication logic
│   ├── voucher-engine.ts   # Voucher generation
│   └── audit.ts            # Audit logging
├── components/
│   ├── ui/                 # UI components
│   └── dashboard/          # Dashboard components
└── middleware.ts           # Next.js middleware
```

## Building for Production

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate Drizzle schema
- `npm run db:migrate` - Run database migrations

## Database Schema

### Tables

- **companies** - Company/organization information
- **users** - User accounts with roles
- **packages** - WiFi packages (time/data based)
- **vouchers** - Generated voucher codes
- **routers** - Router/hotspot devices
- **payments** - Transaction records
- **auditLogs** - System activity logs

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout

### Packages
- `GET /api/packages` - List packages
- `POST /api/packages` - Create package

### Routers
- `GET /api/routers` - List routers
- `POST /api/routers` - Add router

### Vouchers
- `POST /api/vouchers/generate` - Generate vouchers
- `POST /api/portal/login` - Voucher activation

### Health
- `GET /api/health` - Health check

## Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET            # JWT signing secret (min 32 chars for production)
NODE_ENV              # Node environment (development/production)
NEXT_PUBLIC_API_URL   # Public API URL
```

## Security Notes

- Always use strong JWT_SECRET in production
- Enable HTTPS in production
- Use environment variables for sensitive data
- Implement rate limiting on API endpoints
- Use database backups regularly
- Keep dependencies updated

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.