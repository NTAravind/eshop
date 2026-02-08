# Storefront Builder — Component + Data Specs (Registry Contract)

This document defines the production-ready registry surface for the storefront builder:
- node type names
- required props/bindings/actions
- runtime context dependencies
- constraints (children allowed, repeater scoping)
- schema-awareness rules (product types, product schema fields, variant schema fields)

Use this together with:
- rules/storefront-builder-claude.md

---

## 0) Conventions

### Node identity
- Every node has id (uuid/cuid), stable across edits.
- Every node has type (registry key), strict.

### Styling
- All nodes accept styles using the global StyleObject schema (base + breakpoints + states).
- MVP: style applies to outer wrapper.
- Optional: components may expose styleSlots for internal parts.

### Bindings
- bindings: Record<string, string> where key is a prop name and value is a safe path.
- Allowed: a.b.c and a.b[0].c
- Disallowed: expressions, ternaries, function calls, __proto__, constructor, prototype

### Actions
- actions: Record<slotName, ActionRef>
- Slots are explicit per component (onClick, onSubmit, etc)
- Action payload is schema-validated (Zod on server)
- payloadBindings may map payload keys to safe paths

### Repeater scope
Components that provide scope variables for descendants:
- ProductsGrid => item (product), index
- SimilarProductsSection => item (product), index
- CartItems => item (cart line), index
- OrdersPage => item (order), index

Within repeater children, bindings can use item.* plus outer context roots.

---

## 1) RuntimeContext Contract

Minimum required shape (server-created):
- store: { id, name, slug, currency, requirePhoneNumber, ... }
- settings: { deliveryModes, checkoutFields, profileFields, ... }
- user: { id, email, name, phone, ... } | null
- cart: { id, items[], subtotal, total, currency, ... } | null
- route: { pathname, searchParams, params }
- uiState:
  - selectedVariantId?: string
  - deliveryMode?: "DELIVERY" | "PICKUP"
  - activeFilters?: Record<string, string[]>
  - searchQuery?: string
- Route-dependent:
  - collection: { products, total, page, ... } | null
  - facets: { facets: Array<{ id, code, name, values[] }> } | null
  - product: Product | null
  - similarProducts: Product[] | null
  - orders: { results, total } | null

---

## 2) Binding-friendly Data Objects

### Product (customer)
Assume these exist:
- product.id
- product.name
- product.description
- product.images[] (url, alt, position)
- product.variants[] (id, sku, price, stock, customData, images[])
- product.customData (schema-defined)
- product.productSchemaId

### Schema fields
Schemas are stored as JSON arrays:
- productSchema.fields[]
- variantSchema.fields[]

Normalize field key to one canonical string:
- key = field.name ?? field.key

---

## 3) Action IDs (Server-side)

### ADD_TO_CART
- payload:
  - variantId?: string
  - quantity?: number (default 1)
  - openCart?: boolean (default true)
- payloadBindings recommended:
  - variantId: uiState.selectedVariantId or product.variants[0].id

### BUY_NOW
- payload:
  - variantId?: string
  - quantity?: number
- effect: add to cart then navigate to checkout

### SELECT_VARIANT
- payload:
  - variantId: string
- effect: set uiState.selectedVariantId

### SET_DELIVERY_MODE
- payload:
  - mode: DELIVERY | PICKUP

### APPLY_DISCOUNT
- payload:
  - code: string

### OPEN_CART_SIDEBAR
- payload:
  - open: boolean (default true)

### NAVIGATE
- payload:
  - href: string
  - replace?: boolean

---

## 4) Registry Component Specs

Every component must define:
- type (string)
- displayName
- category: layout | content | commerce | navigation
- propsSchema (inspector)
- styleSchema (global style schema reference + restrictions if needed)
- actions (slots)
- constraints (children rules)
- defaults (props/styles/bindings/actions/children)

---

## 4.1 Layout primitives

### Container
- purpose: centered page wrapper
- props: maxWidth: string (default 1200px)
- children: any

### Section
- props: as: section|header|main|footer (default section)
- children: any

### Flex
- props: direction (row|column), gap (number), justify, align, wrap
- children: any

### Grid
- props: columns (1..12), gap
- children: any

### Spacer
- props: size (px number)
- children: none

### Divider
- props: orientation (horizontal|vertical)
- children: none

### Card
- props: variant (default|outline|ghost)
- children: any

### Tabs
- props:
  - tabs: Array<{ id: string, label: string }>
  - defaultTabId?: string
- children: TabPanel nodes (optional strict)
- actions: onTabChange (optional)

### Slot
- special: used only in LAYOUT docs
- runtime replaces Slot with the wrapped page/template tree
- validation: each layout doc must contain exactly one Slot

### Sheet
- shadcn Sheet wrapper
- props: side (left|right), open (boolean runtime-controlled)
- actions: onOpenChange (optional)

---

## 4.2 Navigation

### Navbar
- props: showSearch, showCartButton, showLoginButton
- bindings:
  - store name/logo: store.name, store.logoUrl (if exists)
  - cart count: cart.items.length
- actions:
  - onCartClick => OPEN_CART_SIDEBAR
  - onLoginClick => NAVIGATE

### Footer
- props: columns: Array<{ title, links: Array<{ label, href }> }>

### Link
- props: label, href
- actions: onClick => NAVIGATE

### Breadcrumbs
- props: items?: Array<{ label, href }> (optional)

### SearchBox
- props: placeholder
- actions:
  - onSubmit => updates collection search/query state (implementation-defined)

---

## 4.3 Catalog + Filters

### FilterMenu
- props: mode (sidebar|inline), showCounts
- reads: facets.facets[], uiState.activeFilters
- actions: onChange updates URL query params + uiState

### ProductsGrid (repeater)
- props:
  - source: collection|manual
  - manualProductIds?: string[]
  - columnsDesktop, columnsMobile
- provides scope: item (product), index
- children: a single child template node (recommended), but allow any

### ProductCard (schema-aware)
- props:
  - imageMode: cover|contain
  - showPrice: boolean
  - primaryVariantStrategy: first|selected
  - blocks: Array<BlockSpec>

BlockSpec:
- kind: name|price|image|schemaField|badge
- fieldKey?: string (for schemaField)
- label?: string
- format?: text|currency|date

Default bindings (under ProductsGrid):
- name: item.name
- image: item.images[0].url
- price: item.variants[0].price
- schemaField: item.customData.<fieldKey>

Actions:
- onClick: NAVIGATE to PDP

---

## 4.4 PDP Components

### ProductGallery
- props: thumbs (boolean)
- bindings: images => product.images

### ProductTitle
- bindings: text => product.name

### Selected Variant Contract
Runtime must expose:
- uiState.selectedVariantId
- product.variants[]
Recommended: computed selectedVariant object

### ProductPrice
- bindings: value => selectedVariant.price (recommended)

### SchemaField (schema-aware)
- props: fieldKey, showLabel, fallbackText?, format?
- bindings: value => product.customData.<fieldKey>

### VariantSelector (schema-aware)
- props: mode (dropdown|pills), fieldKey? (optional)
- reads: product.variants[] + variant schema linked to product type
- actions: onChange => SELECT_VARIANT (variantId)

### SimilarProductsSection (repeater)
- props: title, limit
- provides scope: item (product)
- child template: ProductCard

### AddToCartButton
- props: label, quantity (default 1)
- actions: onClick => ADD_TO_CART (variantId from uiState.selectedVariantId)

### BuyNowButton
- props: label
- actions: onClick => BUY_NOW

---

## 4.5 Cart

### CartSidebar
- props: title, side
- reads: cart
- actions: close => OPEN_CART_SIDEBAR open=false

### CartItems (repeater)
- reads: cart.items[]
- provides scope: item
- child template: CartItemRow (optional) or render children as template

### CartSummary
- bindings: subtotal => cart.subtotal, total => cart.total

---

## 4.6 Auth

### LoginCard
- props: title, subtitle
- actions: onSubmit => implementation-defined (navigate to auth)

### LoginScreen
- wrapper page composed from LoginCard + branding

---

## 4.7 Orders

### OrdersPage (repeater)
- reads: orders.results[]
- provides scope: item (order)
- child template: OrderCard

### OrderCard
- bindings: id, status, total, createdAt from item

---

## 4.8 Profile

### UserProfileForm
- reads: user, store.requirePhoneNumber, settings.profileFields
- behavior: phone required if store requires it; show/hide fields based on settings
- actions: onSubmit => PATCH /api/customer/profile

---

## 4.9 Checkout

### CheckoutPage
- reads: cart, user, settings
- children: any

### AddressForm
- reads: billing addresses via /api/customer/billing-addresses
- props: mode: billing|shipping|both

### DeliveryModeSelector
- reads: settings.deliveryModes[], uiState.deliveryMode
- actions: onSelect => SET_DELIVERY_MODE

### PaymentMethodSelector
- reads: store payment configs (runtime provides supported providers)

### PlaceOrderButton
- actions: create order from cart then start payment flow

---

## 5) Editor-only Components

These must not exist in published storefront docs (or must be stripped on publish):
- selection overlays
- dropzone indicators
- resize handles

---

## 6) Validation Rules

- Node type must exist in registry
- Spacer/Divider cannot have children
- Layout docs must contain exactly one Slot
- Pages/templates can reference multiple layouts (ordered)
- Prefab instances must reference an existing PREFAB doc in the same store

---

## 7) Default Documents (Ship with starter set)

Create initial published starter set per store:
- Layouts:
  - GLOBAL_LAYOUT (Navbar + Slot + Footer + CartSidebar)
- Pages:
  - HOME (hero + featured grid)
  - COLLECTION (FilterMenu + ProductsGrid)
  - CHECKOUT
  - ORDERS
  - PROFILE
  - LOGIN
- Templates:
  - PDP:default
  - PDP:<schemaId> created when product type created (optional automation)

---

## 8) Production Readiness Checklist

- Server-side permission checks for admin APIs (store staff role)
- Store isolation in customer APIs (storeId in path)
- Input validation (Zod) for all mutation endpoints
- Safe binding resolver
- Publish flow is atomic (transaction)
- Draft/published separation for documents + theme
- No secrets in documents/theme JSON
