You are Antigravity.

Build a PRODUCTION-READY Super Admin dashboard for a multi-tenant SaaS platform.
This dashboard is used only by platform operators and has full cross-tenant control.

This is a real system. Do not generate demos, mocks, or placeholder data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI / UX SPECIFICATIONS (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) Layout & Hierarchy
- Strict grid system with consistent spacing scale
- Main content dominates the screen
- Navigation is visually quiet and secondary
- No large logos, banners, or marketing elements
- This UI is a tool, not a landing page

2) Color & Token System
- Neutral base palette
- Exactly ONE accent color for:
  - Primary actions
  - Key highlights
- System colors:
  - Red → error and destructive actions
  - Green → success states
- Maintain accessible contrast
- Never rely on color alone to communicate state

3) Navigation
- Persistent LEFT sidebar
  - Grouped links
  - Clear active state
  - Settings and logout pinned to the bottom
- Top bar:
  - Global page actions only
  - Optional global search
- No duplicated navigation

4) Tables (Core Dashboard Utility)
- Tables are the primary UI element
- Use TanStack Table capabilities:
  - Search
  - Filters
  - Sorting
  - Server-side pagination
  - Row selection
  - Bulk actions with contextual toolbar
  - Column visibility and responsive columns

5) Charts (Functional Only)
- Use ONLY line charts and bar charts
- Always include:
  - Axes
  - Labels
  - Values
  - Gridlines
  - Tooltips
- Prefer functional clarity over visuals
- Recharts preferred
- ECharts only for large or high-frequency datasets
- No decorative charts

6) Interaction Patterns (Radix-backed)
- Popover:
  - Small, non-blocking actions
  - Display options
  - Quick filters
- Dialog / Modal:
  - Create
  - Edit
  - Blocking workflows
- Toast notifications:
  - Success
  - Error
  - Warning
- Optimistic UI for common mutations:
  - Immediate UI update
  - Rollback on failure
  - Use React useOptimistic or TanStack Query patterns

7) States & Trust (REQUIRED)
Every data region MUST implement:
- Loading state (skeletons)
- Empty state with clear CTA
- Error state with retry
- Success confirmation (toast)
Users should never wonder: “Did that work?”

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (FIXED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Next.js App Router
- TypeScript
- Prisma (existing schema)
- Server Components + Server Actions
- Shadcn UI ONLY (Radix + Tailwind)
- Tailwind CSS
- No Redux
- No mock data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NO mock data
- NO placeholder arrays
- NO hardcoded JSON
- ALL reads/writes must use Prisma
- ALL Prisma access must be centralized
- ALL mutations must go through Server Actions
- If backend support is missing, explicitly list it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING (SUPER ADMIN ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All pages MUST live under:

/super-admin

Routes:
- /super-admin
- /super-admin/accounts
- /super-admin/accounts/[id]
- /super-admin/plans
- /super-admin/stores
- /super-admin/users
- /super-admin/invoices
- /super-admin/usage
- /super-admin/logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVER ACTION ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create ONE server actions file:

/app/super-admin/_actions/superAdmin.actions.ts

Rules:
- All Prisma calls live here
- No Prisma usage in page or UI components
- Naming convention:
  - listX
  - getX
  - createX
  - updateX
  - deleteX
- Enforce Super Admin authorization on EVERY action

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPER ADMIN POWERS (FULL CONTROL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Super Admin can:

1) Manually create a client
   - Input client email
   - Create BillingAccount
   - Create AccountUser with OWNER role
   - Optionally trigger invite email

2) Assign or change subscriptions manually
   - Attach AccountSubscription to any BillingAccount
   - Select SubscriptionPlan
   - Set status (ACTIVE / TRIAL / CANCELED)
   - Override billing dates if needed

3) Bypass limits
   - Temporarily override UsageCounter limits
   - Mark account as admin-overridden

4) Suspend / reactivate accounts
   - Instantly disable stores
   - Disable API keys

5) Create stores on behalf of clients

6) Revoke API keys platform-wide

7) View all tenants, users, stores, orders, payments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPER ADMIN API ENDPOINT (REQUIRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create ONE real API endpoint:

/app/super-admin/api/overview/route.ts

GET response MUST return REAL aggregated data:

{
  billingAccountCount: number,
  activeSubscriptionsByPlan: {
    FREE: number,
    BASIC: number,
    PRO: number,
    ENTERPRISE: number
  },
  storeCount: number,
  totalOrdersLast30Days: number,
  totalInvoiceRevenue: number,
  failedPaymentsLast30Days: number,
  topApiUsageAccounts: Array<{
    billingAccountId: string,
    apiRequestCount: number
  }>
}

Rules:
- Use Prisma count / sum / groupBy
- Avoid full table scans
- Enforce Super Admin authorization
- Proper HTTP status codes
- Short cache TTL allowed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DASHBOARD FUNCTIONAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/super-admin (Overview)
- KPI cards powered by the overview API
- Primary table: BillingAccounts
- Row selection + bulk actions
- Drill-down navigation

/super-admin/accounts/[id]
- Account summary
- Users
- Stores
- Subscription
- UsageCounters
- Invoices
- API keys
- Super Admin actions

/super-admin/plans
- Create / edit SubscriptionPlans
- Enable / disable plans

/super-admin/stores
- View all stores
- Soft delete store

/super-admin/users
- View users
- Change roles
- Remove users

/super-admin/invoices
- View invoices
- Payment status

/super-admin/usage
- View UsageCounters
- Detect over-limit accounts

/super-admin/logs
- Auth events
- API usage
- Payment failures
- If logs are missing, list backend requirements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return, in this order:

1) Brief explanation of dashboard structure
2) Folder structure
3) Full content of:
   - /app/super-admin/_actions/superAdmin.actions.ts
   - /app/super-admin/api/overview/route.ts
4) One fully implemented Super Admin page using real data
5) List of missing backend support (if any)

Do NOT invent schema fields.
Do NOT include mock data.
Do NOT include marketing UI.
This is a production Super Admin system.



here are the features :
Super Admin Features
Platform Overview

Global dashboard with real-time KPIs

Total billing accounts

Active subscriptions by plan tier

Total stores across the platform

Orders volume (7 / 30 / 90 days)

Revenue metrics (gross, net, failed payments)

Platform-wide API usage

System health indicators

Billing Account Management

View all billing accounts (cross-tenant)

Search, filter, and sort accounts

View full account details

Suspend and reactivate accounts

Archive or soft-delete accounts

Flag accounts as admin-overridden

View account activity history

Manual Client Creation (Super Admin)

Create client using email only

Auto-create billing account

Auto-create owner user

Send or re-send invite emails

Assign subscription during creation

Create trial or paid accounts manually

Bypass standard onboarding flow

Subscription & Plan Management

Create, edit, and disable subscription plans

Assign subscriptions to any account

Change plan tier at any time

Override billing cycles and renewal dates

Convert trials to paid plans

Cancel subscriptions manually

Reactivate canceled subscriptions

View subscription history

Usage & Limits Control

View usage counters per account

Track API requests and feature usage

Detect over-limit accounts

Manually override usage limits

Temporarily increase quotas

Reset usage counters

Mark usage as admin-adjusted

Store Management

View all stores across tenants

Create stores on behalf of clients

Edit store metadata

Disable or suspend stores

Soft-delete stores

View store status and activity

Identify inactive or abandoned stores

User Management

View all users across the platform

View user roles per account

Promote or demote roles

Remove users from accounts

Force user logout

Revoke user access instantly

Detect suspicious user behavior

API Keys & Integrations

View all API keys platform-wide

Revoke API keys globally

Rotate API keys

Disable integrations per account

Detect abnormal API usage

Block API access instantly

Payments & Invoices

View all invoices across tenants

Filter invoices by status

View payment failures

Manually mark invoices as paid

Regenerate invoices

Detect repeated payment failures

Flag high-risk accounts

Logs & Audit Trails

Authentication logs

Subscription and billing events

API usage logs

Admin action logs

Immutable audit trail

Searchable and filterable logs

Security Controls

Suspend accounts instantly

Disable all stores under an account

Revoke all API keys for an account

Force password resets

Detect abnormal activity

Enforce platform-wide restrictions

Bulk Operations

Bulk suspend accounts

Bulk assign subscriptions

Bulk revoke API keys

Bulk archive or delete entities

Background jobs for heavy actions

Safe confirmation for destructive actions

Platform Configuration

Enable or disable global features

Feature flags management

Toggle experimental features

Set platform defaults

Control rate limits

Adjust global constraints

Analytics & Observability

Top accounts by usage

Top revenue-generating accounts

High-API-usage tenants

Growth and churn insights

Usage vs plan mismatch detection

Super Admin Experience

Dedicated /super-admin routes

Strict access control

Zero cross-tenant data leakage

Optimistic UI with rollback

Clear loading, empty, and error states

Full audit visibility

System Safeguards

Confirmation dialogs for destructive actions

Read-only mode for sensitive data

Permission checks on every mutation

Explicit error handling

Recovery paths for failed actions