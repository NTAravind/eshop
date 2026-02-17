# Storefront Builder Guide (Programmer Terms)

This document explains how the builder works at the system level: data structures, rendering, and component registry.

## What It Is
The builder is a visual editor that assembles a **StorefrontNode tree** (JSON) and saves it as a document. At runtime, the tree is rendered by a **Renderer** that resolves bindings, applies styles, and wires actions.

Key types live in `shared/types/storefront-builder.ts`.

## Core Concepts
- **StorefrontNode**: JSON node (id, type, props, bindings, styles, actions, children).
- **Component Registry**: Maps `type` -> React component implementation and exposes metadata (controls, category, constraints).
- **Bindings**: String paths like `product.name` or `cart.total` that resolve against `RuntimeContext`.
- **RuntimeContext**: The data graph for rendering (store, route, cart, collection, facets, prefabs, etc.).
- **Prefabs**: Reusable node trees (e.g., ProductCard). Stored as separate documents and injected at runtime.
- **Actions**: Declarative action refs (e.g., `ADD_TO_CART`) that the dispatcher resolves to client/server handlers.

## Data Flow (High Level)
1. **Builder** stores a document tree (layout/page/template/prefab).
2. **StorefrontPage** loads documents + prefabs + data and creates `RuntimeContext`.
3. **Renderer** walks the node tree:
   - resolves `bindings` into `props`
   - applies safe `styles`
   - creates event handlers from `actions`
   - renders children
4. **Actions** are dispatched via `useActionDispatcher` and may update UI state, navigate, or call server endpoints.

## Files & Responsibilities
- **Registry**: `modules/storefront/registry/*.tsx`
  - Defines components and registers them with metadata.
- **Renderer**: `modules/storefront/runtime/renderer.tsx`
  - Render tree + resolve bindings/styles + run actions.
- **Bindings**: `modules/storefront/bindings.ts`
  - Resolve binding paths; supports repeater scope.
- **Runtime Context**: `modules/storefront/runtime/context.tsx`
  - Provides data + UI state + action dispatcher.
- **Defaults & Prefabs**: `modules/storefront/defaults/*`
  - Seed documents for new stores.
- **Builder UI**: `modules/builder/components/*`
  - Canvas, palette, inspector, layer tree, etc.

## System Structure (Layouts, Pages, Templates, Prefabs)
- **Layouts** define the global frame (header/footer/sidebar). They must include a `Slot` where the page content is injected.
- **Pages** are concrete screens (Home, Collection, Cart, Checkout, etc.). They render inside the active layout.
- **Templates** are page-like documents for dynamic routes (e.g., PDP templates). The system selects a template based on route and product schema.
- **Prefabs** are reusable node trees (ProductCard, Navbar, OrderCard). Components like `ProductGrid` can render prefabs at runtime.

## Component Controls & Constraints
Each registered component can define:
- `controls`: UI controls for props in the inspector (text, select, color, etc.)
- `constraints`: canHaveChildren, allowedChildren, requiredChildren
- `defaults`: initial props/styles/children when added

## Binding Resolution
- Paths like `store.name`, `collection.products`, `cart.items` are resolved at render.
- Repeater context is provided via `__scope.item` and `__scope.index`.
- Prefabs can use the same bindings as regular nodes; they render inside the current context.

## Component Catalog (Registered Components)

### Layout
- **Container**: Generic wrapper for grouping; renders a `div` and passes styles/children.
- **Section**: Semantic section wrapper; used for major page blocks.
- **Row**: Flex row container; aligns children horizontally.
- **Column**: Flex column container; stacks children vertically.
- **Grid**: CSS grid container; lays out children in a grid.
- **Flex**: Flexible container; general flexbox wrapper.
- **Spacer**: Empty space block; used to add padding/gaps.
- **Divider**: Horizontal/vertical line; visual separation.
- **Header**: Site header wrapper; usually holds `Navbar`.
- **Footer**: Site footer wrapper; supports copyright and links.
- **Slot**: Layout placeholder; the page tree is rendered here.

### Content
- **Text**: Plain text block; supports binding and inline styles.
- **Heading**: Title text (h1-h6); size based on level.
- **Image**: Renders an image; supports `fill`, `width`, `height`.
- **Link**: Internal/external link; uses Next.js navigation.
- **Button**: Clickable button; supports variants and actions.
- **Badge**: Small label chip; visual tag.
- **Icon**: Inline icon placeholder; name + size.

### Navigation
- **Navbar**: Top navigation bar; can host `NavItem` children.
- **NavItem**: Single navigation link inside a navbar.
- **NavMenu**: List of links from props (not children).
- **Breadcrumb**: Breadcrumb trail; supports link items.
- **CollectionFilters**: Checkbox filters; syncs to URL query params.
- **CollectionSort**: Sort dropdown; emits selected sort value.
- **NavFilterMenu**: Navbar filter dropdown; clickable filter links in a menu.

### Commerce
- **ProductCard**: Displays a single product; usually driven by prefab or data bindings.
- **ProductGrid**: Lists products; can render `ProductCard` prefab per item.
- **PriceDisplay**: Formats price with currency.
- **VariantSelector**: Variant option picker; updates `uiState.selectedVariantId`.
- **AddToCartButton**: Dispatches `ADD_TO_CART` action.
- **BuyNowButton**: Dispatches `BUY_NOW` action.
- **CartItemCard**: Displays a cart item with qty/price/remove.
- **CartSidebar**: Slide-out cart sheet with item list and totals.

### Forms / Account / Checkout / Orders
- **OAuthButtons**: Social login buttons.
- **LoginForm**: Email/password login form.
- **DeliveryModeSelector**: Delivery or pickup toggle.
- **CheckoutForm**: Customer checkout fields.
- **OrderSummary**: Cart totals summary.
- **PaymentMethods**: Payment option selector.
- **PlaceOrderButton**: Submit checkout action.
- **OrderList**: List of past orders.
- **ProfileCard**: User profile summary.
- **UserProfileForm**: Editable profile form.

### Filters (Legacy)
- **filter-menu**: Checkbox filter panel (collection sidebar style).

### Utility
- **PrefabInstance**: Renders a prefab by key at runtime.

### System Nodes (Advanced)
- **Repeater**: Repeats a child node for each item in a bound array; exposes `item` and `index`.
- **Conditional**: Renders children only if the bound condition is truthy.
