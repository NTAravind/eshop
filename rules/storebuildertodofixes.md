# storebuildertodofixes.md — Storefront Builder TODO Fixes (Required)

This backlog reflects the current repo state. Storefront is path-based (`/store/[slug]/...`) and requires login (no guest carts).

---

## P0 (Must fix for “usable”)

### 1) Product cards per product type (schema-aware)
- Auto-generate a ProductCard prefab per product schema (`ProductCard:<productSchemaId>`) plus fallback `ProductCard:default`.
- Builder: ProductCard prefabs are editable; schema field picker for customData fields.
- Runtime: Collection/SImilar grids render the correct prefab for each product’s `productSchemaId`.
- Update ProductGrid to support productSchemaId filter and cardPrefabKeyMode (perSchema|fixed) and expose it in inspector.

### 2) Builder preview shows real products by default
- Editor preview uses real data: pick a default product (or by schema when editing a PDP template) and a collection slice.
- Add “Preview Product” selector (schema -> product) in the top bar; store in editor state.

### 3) Collection grid: choose product type
- Add `productSchemaId` prop to grids; inspector dropdown of product schemas; server-side filter in collection route for correct totals.

### 4) Login page: Google/Instagram only
- Replace mock LoginForm with OAuth buttons component (registry/forms) that redirects to `/login?callbackUrl=/store/<slug><redirect>`.
- Update seeded LOGIN page to use OAuth buttons; keep storefront page branded while auth happens at `/login`.

### 5) Profile: real editable form
- Add `UserProfileForm` component: fields driven by `Store.requirePhoneNumber` + `settings.profileFields`; PATCH `/api/customer/profile`.
- Seed PROFILE page with this form; add `/store/[slug]/profile/page.tsx` route (login-required) passing `user`.

### 6) Orders render correctly
- Standardize OrdersContext: always `{ results, total, page, pageSize }`.
- Orders route should pass OrdersContext (not array).
- Fix OrderList/OrderCard bindings to match the context.
- Fix Repeater contract (choose one): either `props.dataPath` or `bindings.items`, and update renderer + prefabs accordingly.

### 7) Checkout page cleanup + functionality (login-required)
- Enforce login on checkout; load cart server-side; pass cart into StorefrontPage.
- Replace placeholder CheckoutForm/PaymentMethods with structured components: contact, address, summary, delivery mode, payment, place order.
- Wire create-order + payment intent; delivery mode uses `settings.deliveryModes`.

### 8) Price units + currency formatting
- Decide canonical unit (cents). Format everywhere with `store.currency`; remove hardcoded `$`/toFixed on raw cents.

---

## P1 (Needed for “complete builder”)

### 9) Store-relative navigation
- Centralize internal href to `/store/${slug}${path}`; apply to NAVIGATE action, Navbar/NavItem/Product links, cart checkout link, seeded docs.

### 10) Theme CSS var mapping (shadcn compatible)
- Map ThemeVars camelCase -> kebab CSS vars (e.g., cardForeground -> --card-foreground).
- Use the same mapping in builder preview (Canvas) and runtime layout client.

### 11) Cart actions + refresh (login-only)
- Cart actions require userId; getOrCreateCart with userId; refresh cart after add/update (StorefrontPage onCartRefresh real fetch).

### 12) Product card visual polish
- Make ProductCard look like a card (var(--card), padding, hover shadow, consistent typography). Ensure ProductGrid spacing/responsive cols.

### 13) Inspector completeness
- Registry-driven Props/Bindings/Actions UI; add binding path picker (schema-aware for customData); add action editor (slot -> actionId -> payload + payloadBindings) with validation.

### 14) Facets filtering end-to-end
- Provide facets data on collection route; filter menu syncs URL query; server-side product query applies filters.

### 15) Prefabs + multi-layout stacking
- Implement PrefabInstance expansion + overrides in renderer.
- Implement ordered `layoutRefs` composition; validate exactly one Slot per layout.

---

## Notes on current issues (observed)
- Builder preview mock context is empty; needs real product/collection data.
- Orders route passes array; default doc expects orders.results; Repeater contract inconsistent.
- LoginForm mock is non-functional; OAuth only providers (Google/Instagram) are configured.
- Navbar/cart links not store-prefixed.
- Theme injection is not shadcn-compatible (wrong var names) in runtime and builder.
- ProductCard component uses raw `$` and toFixed on assumed dollars; unit should be cents + formatter.
