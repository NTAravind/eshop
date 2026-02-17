# Project Structure

This document explains the top-level layout, key directories, and the role of important files.

## Top-Level Layout

```
app/                Next.js app router (route groups, pages, layouts, API handlers)
modules/            Feature modules (builder, storefront, admin, auth, superadmin)
server/             Server-side logic (actions, services, DAL, auth, payments, validators)
shared/             Reusable UI, hooks, utils, and shared types
docs/               Project documentation, rules, and reference assets
prisma/             Prisma schema and migrations
public/             Static assets served by Next.js
scripts/            Local scripts (maintenance, one-off tasks)

components.json     Shadcn/ui generator config + aliases
eslint.config.mjs   ESLint configuration
next.config.ts      Next.js config
postcss.config.mjs  PostCSS configuration
prisma.config.ts    Prisma config helpers
tsconfig.json       TypeScript config + path aliases
package.json        Dependencies and scripts
README.md           Project overview and usage notes
```

## app/
All route handlers and UI entry points. Route groups are used to keep URLs stable while organizing the tree.

```
app/
  (console)/admin/       Admin console routes
  (console)/superadmin/  Superadmin console routes
  (storefront)/store/    Public storefront routes
  (auth)/auth/           Auth flows (NextAuth and custom pages)
  (auth)/login/          Login route(s)
  (auth)/invite/         Invitation flows
  (internal)/doc/        Internal docs pages (optional)
  api/(console)/...      Admin/superadmin APIs
  api/(storefront)/...   Storefront/customer APIs
  api/(platform)/...     Platform APIs
  api/auth/...           Auth APIs (NextAuth)
```

## modules/
Feature-level UI and logic. Each module owns its components and related helpers.

```
modules/
  admin/components/        Admin dashboard UI components
  auth/components/         Auth UI components/providers
  builder/                 Storefront builder core
    components/            Builder UI (canvas, inspector, panels)
    editor-store.ts        Zustand editor state
    snapping.ts            Canvas snapping utilities
    theme-presets.ts       Builder theme presets
  storefront/              Storefront runtime, registry, defaults, bindings
  superadmin/components/   Superadmin dashboard UI components
```

## server/
Back-end domain logic and server-only utilities.

```
server/
  actions/                 Server actions (e.g., seed-store)
  auth/                    NextAuth config + auth guards
  db/                      Prisma client and DB helpers
  dal/                     Data access layer (prisma queries)
  middleware/              API middleware (apiKey, rate limiter)
  payments/                Payment gateway integrations
  rbac/                    Role/permission helpers
  services/                Business logic services
  tenant/                  Multi-tenant helpers and validation
  validators/              Zod/validation utilities + tests
```

## shared/
Reusable pieces shared across modules and routes.

```
shared/
  components/
    ui/                    Design system components (shadcn/ui)
    modals/                Shared modal components
    providers.tsx          App-wide providers composition
  hooks/                   Shared React hooks
  utils/                   Utility functions (formatting, crypto, errors)
  types/                   Shared TypeScript types
```

## docs/
Project documentation and references.

```
docs/
  assets/inspo/            UI inspiration assets (non-production)
  notes/                   Misc notes (legacy errors, scratch)
  rules/                   Internal guidelines
  project-structure.md     This file
```

## Path Aliases (tsconfig.json)
Legacy aliases are preserved for compatibility, but mapped to the new structure:

```
@/components/*   -> shared/components/* + modules/*/components/*
@/lib/*          -> modules/* + server/* + shared/* (mapped per sub-path)
@/services/*     -> server/services/*
@/dal/*          -> server/dal/*
@/hooks/*        -> shared/hooks/*
```

Use module- or shared-based imports for new code, and keep server logic under `server/`.
