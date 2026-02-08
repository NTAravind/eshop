# Storefront Builder (Framer-like / Framely-inspired) — Claude Implementation Plan

This repo is a Next.js App Router e-commerce platform (React 19, Next.js, shadcn/ui, Tailwind, Prisma). Implement a production-ready storefront builder that:
- feels like Framer in UX (left palette/layers, canvas with selection overlay, right inspector, top bar)
- uses editable shadcn UI components as building blocks
- supports schema-aware commerce blocks (multiple product types/schemas, variant selector, schema field picker)
- supports a tweakcn-like theme editor using tweakcn UI
- supports a document system: layouts -> templates/pages -> prefabs/components
- supports path-based storefront routing

Use Framely (github.com/belastrittmatter/Framely) as UI/UX reference for editor layout patterns:
- left sidebar: icon tabs (components/layers), collapsible
- right sidebar: visible only when an element is selected; accordion settings groups
- canvas: click background to deselect; preview mode hides sidebars; device switch

---

## Non-negotiables (Security + Maintainability)

1. Strict registry: only registered components can be used (no arbitrary component injection).
2. No business logic inside registry components: components render props only. Data fetch/mutations happen in runtime/context/actions.
3. Safe bindings: bindings are path strings (e.g. product.customData.material) resolved by a safe resolver:
   - allow: a.b.c and a.b[0].c
   - forbid: function calls, expressions, __proto__, constructor, prototype
4. Declarative actions: nodes reference action IDs + schema-validated payload; handlers enforce store isolation and auth.
5. Production-ready tenant isolation: every write/mutation must verify storeId ownership and user/session/cart ownership.

---

## Recommended Defaults (Use these unless forced otherwise)

- PDP templates keyed by productSchemaId: TEMPLATE key PDP:<productSchemaId>, fallback PDP:default.
- Link variant schema at product-type level (recommended): add variantSchemaId to ProductSchema.
- Path-based storefront: app/store/[slug]/... resolves storeId from slug server-side.
- Drag/drop: use dnd-kit.
- Validation: use Zod for API and action payloads.

---

## Architecture

### 1) Storefront Document System (DB-backed)

Storefront is composed from multiple documents:
- LAYOUT: wrappers with a Slot component (like Next.js layouts)
- PAGE: concrete page trees (HOME, COLLECTION, LOGIN, CHECKOUT, ORDERS, PROFILE)
- TEMPLATE: specialized page trees (PDP per productSchemaId)
- PREFAB: reusable component documents (symbol/prefab instances inside pages)

### 2) Runtime Renderer

- loads published docs + published theme for a store
- builds RuntimeContext based on route (store, user, cart, product, collection, facets, orders, settings, uiState)
- resolves bindings + styles + actions
- renders registry components

### 3) Editor (Builder)

- edits draft documents only (save draft / publish)
- uses the same registry renderer in mode=editor
- selection overlay and inspector update node JSON
- undo/redo history
- theme editor edits draft theme vars and previews live

---

## Data Model (Prisma) — Required

### A) Storefront documents

Create StorefrontDocument to store JSON trees:

- StorefrontDocument
  - id: String @id @default(cuid())
  - storeId: String @index
  - kind: StorefrontDocKind enum: LAYOUT | PAGE | TEMPLATE | PREFAB
  - key: String
  - status: StorefrontDocStatus enum: DRAFT | PUBLISHED | ARCHIVED
  - tree: Json
  - meta: Json?
  - createdAt, updatedAt
  - @@unique([storeId, kind, key, status])

Key convention examples:
- Layouts: GLOBAL_LAYOUT, NAV_LAYOUT, FOOTER_LAYOUT
- Pages: HOME, COLLECTION, CART, CHECKOUT, LOGIN, ORDERS, PROFILE
- Templates: PDP:default, PDP:<productSchemaId>
- Prefabs: PREFAB:<nameOrCuid>

### B) Theme

- StorefrontTheme
  - id
  - storeId @index
  - status: DRAFT | PUBLISHED
  - vars: Json (CSS var map; shadcn tokens)
  - @@unique([storeId, status])

### C) Storefront settings

Option A (recommended): StorefrontSettings model:
- storeId @unique
- settings: Json (delivery modes, required fields, etc.)

Option B: Store.storefrontSettings Json?

### D) Link product types to variant schema (recommended)

Add to ProductSchema:
- variantSchemaId String?
- relation to VariantSchema

---

## API Surface (App Router routes)

All storefront runtime APIs must be store-scoped under:
app/api/customer/stores/[storeId]/...

Do not rely on x-store-id headers for storefront runtime.

### Documents + theme (admin)

Under store admin scope:
- GET/POST app/api/admin/stores/[storeId]/storefront/documents
- GET/PATCH/DELETE app/api/admin/stores/[storeId]/storefront/documents/[docId]
- POST app/api/admin/stores/[storeId]/storefront/documents/[docId]/publish
- GET/PATCH app/api/admin/stores/[storeId]/storefront/theme (draft)
- POST app/api/admin/stores/[storeId]/storefront/theme/publish

### Storefront runtime (customer)

- Products:
  - GET app/api/customer/stores/[storeId]/products
  - GET app/api/customer/stores/[storeId]/products/[productId]
- Categories:
  - GET app/api/customer/stores/[storeId]/categories
- Schemas:
  - GET app/api/customer/stores/[storeId]/product-schemas
- Facets:
  - GET app/api/customer/stores/[storeId]/facets (store-scoped)
- Cart:
  - GET/POST app/api/customer/stores/[storeId]/cart
  - POST/PUT/DELETE app/api/customer/stores/[storeId]/cart/items
- Orders:
  - GET app/api/customer/stores/[storeId]/orders
- Profile:
  - GET/PATCH app/api/customer/profile (existing)

All cart/order operations must ensure:
- store matches
- cart belongs to userId or sessionId
- orders list requires user auth

---

## Runtime Storefront Routing (Path-based)

Implement pages under app/store/[slug]/...:
- page.tsx (HOME)
- collection/page.tsx
- products/[productId]/page.tsx (PDP)
- checkout/page.tsx
- orders/page.tsx
- profile/page.tsx
- login/page.tsx

Create app/store/[slug]/layout.tsx:
- resolve store by slug server-side
- load published theme and inject CSS vars
- provide StorefrontRuntimeProvider with storeId and slug

---

## Storefront Builder UI (Admin) — Framer-like layout

Place under:
app/admin/stores/[storeId]/(dashboard)/storefront/builder/...

Pages:
- Document list: .../storefront/builder/page.tsx
- Editor: .../storefront/builder/[docId]/page.tsx

Editor layout (Framely-inspired):
- Top bar: doc name/status, device switch, preview toggle, undo/redo, save draft, publish, theme editor
- Left sidebar: icon tabs Components/Layers, collapsible
- Canvas: renders doc JSON, selection overlay, click background to deselect, preview hides chrome
- Right sidebar: only when node selected; tabs Props/Styles/Bindings/Actions; accordions for grouped settings

Drag/drop:
- Drag components from palette into canvas
- Drop zones enforce registry constraints

Undo/redo:
- history stack of JSON docs

---

## Core Types (Strict JSON)

Define in types/storefront-builder.ts (or align existing builder types):

- StorefrontNode:
  - id: string
  - type: string
  - props: Record<string, unknown>
  - styles: StyleObject (schema constrained)
  - bindings: Record<string, string>
  - actions: Record<string, ActionRef>
  - children: StorefrontNode[]

- StorefrontDocumentRoot:
  - id, storeId, kind, key, status
  - layoutRefs?: string[] (ordered list of layout doc IDs)
  - tree: StorefrontNode

- ActionRef:
  - actionId
  - payload
  - payloadBindings?: Record<string, string>

- RuntimeContext:
  - store, settings, user, cart, product, collection, facets, orders, route, uiState

---

## Binding Resolver (Safe)

Implement lib/storefront/bindings.ts:
- parse allowed path syntax
- walk object safely
- return undefined for missing
- disallow prototype keys
- never throw

Add helper for editor: generate binding paths from schema field selection.

---

## Style System (Framer-like, schema-driven)

Use a safe StyleObject schema (base + breakpoints + states). Restrict to safe keys.

Renderer maps StyleObject -> inline style (CSSProperties) only for allowed keys.

---

## Action System (Production-ready)

Create lib/storefront/actions/registry.ts with action definitions:
- ADD_TO_CART
- BUY_NOW
- SELECT_VARIANT
- APPLY_DISCOUNT
- SET_DELIVERY_MODE
- OPEN_CART_SIDEBAR
- NAVIGATE

Action handlers are server-only:
- validate payload with Zod
- enforce store/session permissions

Dispatching:
- nodes attach onClick/onSubmit to a dispatcher
- dispatcher calls store-scoped API route (or server action)
- returns normalized results (updated cart, redirect URL, toast)

---

## Component Registry (Predefined editable shadcn components)

Implement registry in lib/storefront/registry.tsx. Components must be editable by props/styles/bindings/actions.

Layout primitives:
- Container, Section, Flex, Grid, Stack, Spacer, Divider, Slot, Card, Tabs, Sheet

Navigation:
- Navbar, Footer, Link, Breadcrumbs, SearchBox

Catalog/filter:
- FilterMenu (binds to facets + query state)
- ProductsGrid (repeater)
- ProductCard (schema-aware blocks)

PDP:
- ProductGallery, ProductTitle, ProductPrice, SchemaField, VariantSelector, SimilarProductsSection, AddToCartButton, BuyNowButton

Cart:
- CartSidebar, CartItems, CartSummary

Auth:
- LoginCard, LoginScreen

Orders:
- OrdersPage, OrderCard

Profile:
- UserProfileForm (conditional by store/settings)

Checkout:
- CheckoutPage, AddressForm, DeliveryModeSelector, PaymentMethodSelector, PlaceOrderButton

All components expose:
- propsSchema (for inspector)
- styleSchema
- bindingHints
- constraints (children rules)
- defaults

---

## Prefabs (Symbols) — Required

Support prefab instances in JSON:
- Node type PrefabInstance with props { prefabId, overrides? }
- Renderer resolves prefab doc tree and merges overrides
- Editor supports:
  - Create Prefab from Selection
  - Detach Instance
  - Edit Prefab

---

## Layout Inheritance (Next.js-like)

Pages/templates can apply multiple layouts:
- document.layoutRefs = [layoutDocId1, layoutDocId2, ...]
- each layout doc must contain exactly one Slot

Runtime composition:
- render page tree into Slot of innermost layout, wrap outward

Editor:
- select multiple layouts (ordered)
- validate Slot exists

---

## Theme Editor (tweakcn UI)

Build a theme editor that edits shadcn CSS variables:
- StorefrontTheme(status=DRAFT) holds vars
- preview applies draft vars live
- publish copies/activates to PUBLISHED atomically

Runtime injection:
- app/store/[slug]/layout.tsx loads published theme vars
- inject vars scoped to storefront root wrapper

---

## Performance + UX Requirements

- Avoid full-tree rerenders on small changes; memoize rendered nodes.
- Keyboard shortcuts: Esc deselect, Delete node, Ctrl/Cmd+Z undo, Shift+Ctrl/Cmd+Z redo.
- Preview mode hides editor chrome.

---

## Implementation Steps

Phase 1:
- Prisma models + migrations
- DAL/services
- Admin CRUD + publish APIs

Phase 2:
- Runtime renderer + storefront routes
- Layout composition + theme injection

Phase 3:
- Builder UI (Framely-like)
- JSON ops + undo/redo + drag/drop

Phase 4:
- Commerce components + schema-aware inspector

Phase 5:
- Theme editor (tweakcn UI)

Phase 6:
- Prefabs + multi-layout UI polish + validations

---

## Acceptance Criteria

- Storefront routes render from published documents (no placeholder pages).
- Builder can create/edit/publish layouts/pages/PDP templates/prefabs.
- Schema-aware binding UI works for product customData.
- Cart, checkout, orders, profile, login exist as editable predefined docs.
- Strict store isolation and payload validation.
- No arbitrary JS execution; bindings are safe path strings.
