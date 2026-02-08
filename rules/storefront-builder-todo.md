# Storefront Builder TODO (login-required, path-based)

Status: pending

## High-priority tasks
1) Enforce login across storefront
   - Require auth on cart, checkout, profile, orders routes
   - Add `/store/[slug]/profile` route; storefront login page is branded wrapper that links to `/login?callbackUrl=/store/<slug>`

2) Store-relative navigation
   - Prefix NAVIGATE, Link/NavItem/Navbar/ProductCard hrefs with `/store/${slug}`
   - Fix default docs links to be store-prefixed

3) PDP template selection (multi product types)
   - In products/[productId]/page.tsx: try `PDP:<productSchemaId>`, fallback `PDP:default`

4) Cart lifecycle (login-only)
   - Load cart server-side for authenticated user and pass into StorefrontPage
   - Actions use `{ userId }` (no guest/session); refresh cart after add/update

5) Theme variable mapping
   - Map ThemeVars camelCase -> CSS vars (`--background`, `--card-foreground`, etc.)
   - Use same mapping in runtime injection and builder preview

6) Seed + route completeness
   - Seed CART page doc (draft + published); add matching route
   - Add profile route; ensure every seeded doc has a route and vice versa

7) Inspector completeness
   - Registry-driven Props/Bindings/Actions UI
   - Allow adding/editing actions + payloadBindings; add bindings editor with schema-aware field picker

8) Facets & filters end-to-end
   - Provide facets data to collection page; sync URL query; apply filters in product query (store-scoped)

9) Prefabs + multi-layout stacking
   - Implement PrefabInstance expansion + overrides
   - Support ordered layoutRefs; validate exactly one Slot per layout

10) Actions hardening
    - Zod-validate payloads (already); add auth/RBAC checks in action handlers; return redirect hint on unauthorized

11) Tests
    - Unit tests: binding resolver, document validation (Slot/constraints), action payloads
    - Smoke/E2E: publish -> render -> add to cart -> checkout
