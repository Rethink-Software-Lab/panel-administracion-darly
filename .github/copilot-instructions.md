# AI Coding Agent Instructions - Panel Administración (Frontend)

## Project Overview
**Next.js 16** TypeScript frontend for inventory management system. Consumes Django REST API via proxy pattern with JWT authentication.

## Architecture

### Stack
- **Framework**: Next.js 16.0.10 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn UI components
- **Database Access**: Drizzle ORM (PostgreSQL via Neon)
- **State/Forms**: React Hook Form + TanStack React Table
- **Auth**: JWT via HttpOnly cookies

### Route Structure
```
app/
├── (with-layout)/        # Authenticated routes - has sidebar
│   ├── layout.tsx        # Main app layout
│   ├── services.ts       # API calls for all routes
│   ├── types.ts          # Shared types
│   ├── reportes/
│   ├── inventario/
│   ├── cafeteria/
│   └── [other features]/
├── (without-layout)/     # Public routes
│   └── login/
└── api/                  # Next.js API routes (minimal use)
```

**Key Pattern**: API integration centralized in `app/(with-layout)/services.ts` - all feature routes import from it.

## Critical Patterns

### 1. API Calls via Proxy Service
```typescript
// app/(with-layout)/services.ts - DO NOT BYPASS THIS
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`/api/proxied/${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    ...options
  });
  return response.json();
};
```
**Why**: Handles JWT injection automatically. Use this for all backend calls.

### 2. Database Queries with Drizzle
Located in `db/schema.ts` (auto-generated from PostgreSQL):
```typescript
// Access via drizzle queries (if needed in Server Components)
import { db } from '@/db';
const records = await db.select().from(tableName);
```
**Important**: Schema is auto-generated from Django DB via `drizzle-kit generate`. Don't edit manually.

### 3. TypeScript Types
Shared types in `app/(with-layout)/types.ts`:
```typescript
export interface Producto {
  id: number;
  nombre: string;
  // Matches Django model fields
}
```
**Keep synchronized** with Django model updates.

### 4. Server Actions for Auth
```typescript
// lib/actions.ts - Server-side only
'use server';
export async function logout() {
  (await cookies()).delete('session');
  redirect('/login');
}
```
Use Server Actions only for auth mutations - keep light.

## Development Workflow

### Start Dev Server
```bash
cd panel-administracion
npm run dev                # Starts on port 3000
```

### Build & Test
```bash
npm run build             # Type-check + build
npm run test             # Vitest (see vitest.config.mjs)
npm run lint             # ESLint
```

### Update Drizzle Schema
After Django migrations run:
```bash
cd panel-administracion
DATABASE_URL=<connection-string> drizzle-kit generate
```
Then commit updated `db/schema.ts`.

## Code Style & Conventions

### Components
- Use Shadcn UI from `components/ui/` - don't create custom CSS
- Export only default for route components
- Use `'use client'` only when needed (forms, interactivity)
- Prefer Server Components by default

### Forms
```typescript
// Use React Hook Form + validation
import { useForm } from 'react-hook-form';
import { schemas } from '@/lib/schemas';

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schemas.mySchema),
  });
  // ... form implementation
}
```

### Naming Conventions
- **Routes**: kebab-case (`/inventario/create-entrada/`)
- **Components**: PascalCase (`ProductCard.tsx`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Drizzle tables**: camelCase (`inventarioProducto`)

## File Locations Reference

| Feature | Location |
|---------|----------|
| Page components | `app/(with-layout)/[feature]/page.tsx` |
| API integration | `app/(with-layout)/services.ts` |
| Shared types | `app/(with-layout)/types.ts` |
| Shadcn components | `components/ui/` |
| Database schema | `db/schema.ts` |
| Auth & JWT | `lib/auth.ts`, `lib/getSession.ts` |
| Validation schemas | `lib/schemas.ts` |
| Utilities | `lib/utils.ts` |

## Authentication

### Token Flow
1. Login via Django endpoint → JWT token returned
2. Token stored in HttpOnly cookie (secure)
3. `getSession()` retrieves token for requests
4. All API calls in `services.ts` auto-inject token

### Protected Routes
Check session in layout or page:
```typescript
import { getSession } from '@/lib/getSession';

export default async function Page() {
  const session = await getSession();
  if (!session) redirect('/login');
  // ... protected content
}
```

## Common Tasks

### Add New Feature Page
1. Create folder in `app/(with-layout)/[feature]/`
2. Add `page.tsx` (Server Component by default)
3. Add service functions to `services.ts`
4. Add types to `types.ts`
5. Import Shadcn UI components for UI

### Add New API Service
1. Add function to `app/(with-layout)/services.ts`
2. Use `apiCall()` helper internally
3. Export typed return (use interfaces from `types.ts`)

### Update Form Validation
1. Add schema to `lib/schemas.ts` using Zod
2. Use with `zodResolver` in `useForm()`
3. Update corresponding Django endpoint schema

## Important Notes

- **No custom CSS**: Use Tailwind classes + Shadcn components only
- **JWT expiry**: 4 weeks (set by Django backend)
- **Cloudinary images**: Configure in `next.config.ts` remotePatterns
- **TypeScript**: Strict mode ON - use types everywhere
- **Environment**: `.env.local` for `DATABASE_URL`, `JWT_SECRET_KEY`, etc.

## Debugging

- Check browser console for React/TypeScript errors
- Use `npm run build` to catch type errors before dev
- Verify Drizzle queries with `console.log(query)` before execution
- Test API calls through `/api/proxied/` proxy, not directly to Django

## Deployment

- **Host**: Vercel (configured in `vercel.json`)
- **Build**: `npm run build` (runs type-check + build)
- **Environment**: Add `DATABASE_URL`, `JWT_SECRET_KEY` to Vercel secrets
