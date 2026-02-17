# Antigravity Plan: Framer-Like (Framely-Style) Freeform Builder UX

Target UX reference: Framely (https://github.com/belastrittmatter/Framely)
Mode decision: **Freeform-first** (absolute positioning by default; Framer-canvas style)

This repo already has: builder shell (`components/builder/*`), runtime renderer (`lib/storefront/runtime/*`), registry-driven components (`lib/storefront/registry/*`), editor store with history (`lib/builder/editor-store.ts`), and settings in admin for delivery modes.

## High-Level Outcomes
- Builder feels like a design tool (Framer): hover/selection chrome, snap/drag/resize, pan/zoom, layered sidebars.
- Components drop into freeform canvas with immediate position/size; snapping and guides ensure alignment.
- Layers, Components, and Inspector UIs mirror Framely’s usability.
- Cart/checkout/storefront flows stay functional (no regressions), and settings flow through runtime.

## A) Non-Negotiable Functional Fixes (Do First)
1) **Pickup checkout must not fail**
   - `app/api/customer/orders/create/route.ts`: accept `deliveryMode`; shipping required only for `DELIVERY`, optional for `PICKUP`.
   - `lib/storefront/actions/handlers.ts` (PLACE_ORDER): include `context.uiState.deliveryMode` in payload.
   - UI still hides shipping for pickup; API must allow it.
2) **Remove cart redirect hack**
   - Stop using `components/storefront/runtime/CartHandler.tsx` in `app/store/[slug]/_components/StorefrontPage.tsx`.
   - Cart must open as sidebar (see WT-Cart below), not navigate to `/cart`.
3) **Revalidation uses slug, not storeId**
   - `app/admin/stores/[storeId]/(dashboard)/settings/storefront/actions.ts`: lookup slug; `revalidatePath(/store/${slug})` and `/store/${slug}/checkout`.

## B) Freeform Model
- Canvas/root (and “Frame” containers) are positioning contexts (`position: relative`).
- New nodes default to `position: absolute` with px `left/top/width/height` set on drop.
- Stacking order: child order + optional `zIndex`.

## C) Builder Workstreams
### WT1: Editor Shell (Left/Canvas/Right)
- Left: Components tab + Layers tab (icon rail + collapsible content), search on both.
- Canvas toolbar: Select/Hand, Snap toggle, Grid toggle, Zoom + Fit.
- Right: slides in only when a node is selected; tabs minimal (Design/Content/Data/Actions/Theme).

### WT2: Canvas Interaction Engine
- Hover outline; selection outline with label.
- Drag move for `absolute`/`fixed`; on drag start compute missing `left/top` from current rect.
- Resize with 8 handles; Shift locks aspect; Alt resizes from center.
- Keyboard nudge: Arrow=1px, Shift+Arrow=10px.
- Pan/zoom: Space+drag to pan; Ctrl/Cmd+wheel zoom to pointer; Fit button.
- Snapping + guides: grid (8px), parent edges/centers, sibling edges/centers; render snaplines.

### WT3: Layers Panel (Framer-grade)
- Collapse/expand; select.
- Drag-drop reorder and reparent (respect `constraints.canHaveChildren`).
- Visibility toggle (`hidden` flag respected by renderer) and Lock (non-movable/selectable on canvas).
- Label priority: `props.name` > registry displayName > type; preview text if available.

### WT4: Components Tab (Library UX + Drop Preview)
- Search + category counts; richer list items.
- Drag shows valid drop targets; insertion ghost/preview.
- On drop: insert into target parent and set `left/top` to pointer-relative coords; default `width/height` from definition (fallback: 240x80 or sensible per type).
- Requires per-node droppable wrappers (see BuilderRenderer).

### WT5: Inspector (Design Tool Style)
- Tabs: Design (Transform/Appearance/Typography/Effects), Content (props), Data (bindings), Actions, Theme.
- Transform: X/Y, W/H, position (static/relative/absolute/fixed), zIndex, margin/padding (link-unlink), rotation (later).
- Appearance: background, border, radius, shadow, opacity.
- Typography: font family/weight/size/line-height/letter-spacing/align/transform.
- Enforce style allowlist (`lib/storefront/styles.ts`).
- “Freeform” toggle: sets position absolute and ensures parent is positioning context (Frame/relative parent).

### WT6: Builder Renderer Wrapper (Selection/Droppable)
- Add builder-only renderer (e.g., `lib/builder/renderer/BuilderRenderer.tsx`): wraps each node, registers droppable target, handles hover/select, and optionally draws chrome (or cooperates with overlay).
- Alternative: add `wrapNode` option to `lib/storefront/runtime/renderer.tsx` used only in builder.

### WT7: shadcn Sheet + Cart Sidebar + Cart Item Card
- Add `components/ui/sheet.tsx` (Radix Dialog-based sheet; mirror Framely’s `src/components/ui/sheet.tsx`).
- Refactor `CartSidebar` (`lib/storefront/registry/commerce.tsx`) to use Sheet:
  - controlled by `isOpen` / `uiState.cartSidebarOpen`.
  - close via `onClose` or default `setUIState('cartSidebarOpen', false)`.
- Add `CartItemCard` component in registry (props: item, currency; controls: showImage/showVariant/showQuantity/showRemove). Use in sidebar (and cart page default if desired).

### WT8: Editable Labels (No Hardcoded UI Strings)
- Navbar (`lib/storefront/registry/navigation.tsx`): add props/controls `cartLabel`, `accountLabel`, `showCart`, `showAccount`; avoid hardcoded text.
- CartSidebar: add `titleText`, `checkoutButtonText` props/controls (or render Button node in prefab).
- DeliveryModeSelector: optional `deliveryLabel`, `pickupLabel` controls if you want text editable.
- Prefer prefab-driven Navbar/CartSidebar (`lib/storefront/defaults/prefabs/*.ts`) plus `PrefabInstance` so structure + labels are editable.

### WT9: Prefab Runtime Parity
- Ensure live storefront passes prefabs map into runtime context:
  - Load with `services/storefront.service.ts#getPublishedPrefabs` in storefront routes.
  - Pass into `RuntimeContextProvider` as `pageData.prefabs` in `app/store/[slug]/_components/StorefrontPage.tsx` (and pages that render it).

## D) Storefront Functional Changes (Runtime/Admin/Checkout)
1) Delivery modes respected end-to-end:
   - Defaults to both if settings row missing.
   - Checkout shows only enabled modes; single-mode UX not confusing.
2) Pickup checkout works:
   - API conditional validation; payload carries `deliveryMode`.
3) Cart sidebar is a Sheet:
   - No redirect; open/close via `uiState.cartSidebarOpen`.
   - CartItemCard renders items.
4) Editable labels everywhere:
   - Navbar/Cart/Delivery selector not hardcoded.
5) Prefabs work live:
   - `PrefabInstance` renders with provided prefabs on storefront pages.
6) Revalidation uses slug:
   - Admin settings action revalidates `/store/${slug}` and `/store/${slug}/checkout`.
7) State via runtime actions/uiState, not DOM events.

## E) Framely File-to-Repo Mapping (What to Copy/Adapt)
- Top bar: `Framely/src/app/components/editor/editor-navigation.tsx` → `components/builder/TopBar.tsx` (device switch, undo/redo, preview, save buttons).
- Left sidebar: `Framely/.../editor-sidebar/left-sidebar.tsx` → `components/builder/EditorLayout.tsx` (left panel structure). Consider porting sidebar primitive or mimic behavior.
- Right sidebar: `Framely/.../editor-sidebar/right-sidebar.tsx` → `components/builder/Inspector.tsx` container behavior (slide-in on selection).
- Settings tab orchestrator: `Framely/.../settings-tab/index.tsx` → Inspector accordions.
- Transform settings: `Framely/.../settings-tab/transform-settings.tsx` → Inspector Transform section (add X/Y + zIndex + position).
- Typography settings: `Framely/.../settings-tab/typography-settings.tsx` → Inspector Typography section (color picker + selects + tabs).
- Layers tree: `Framely/.../layers-tab/index.tsx` → `components/builder/LayerTree.tsx` (expand/collapse UI; add DnD + hide/lock).
- Components tab: `Framely/.../components-tab/index.tsx` + `elements.ts` → `components/builder/ComponentPalette.tsx` (search, categories, draggable items).
- Element wrapper pattern: `Framely/.../editor-components/element-wrapper.tsx` → implement BuilderRenderer wrapper for hover/select/droppable.
- Container drop behavior: `Framely/.../editor-components/container.tsx` → drop highlight + insert; adapt to dnd-kit and freeform absolute left/top.
- Sidebar primitive: `Framely/src/components/ui/sidebar.tsx` → optional; use if you want same collapsible/offcanvas behavior.
- Sheet primitive: `Framely/src/components/ui/sheet.tsx` → add to `components/ui/sheet.tsx` for CartSidebar (and mobile sidebars if desired).

## F) Suggested Execution Order
1) Fix A1/A2/A3 (pickup API, remove cart redirect, revalidate slug)
2) Add Sheet + refactor CartSidebar + add CartItemCard + editable labels (WT7/WT8)
3) Prefab runtime parity (WT9)
4) Canvas interaction engine (WT2) + freeform drop (WT4)
5) Layers DnD + reparent + hide/lock (WT3)
6) Inspector redesign (WT5) and shell polish (WT1)

## G) Definition of Done
- Canvas: stable select/move/resize with snapping, guides, pan/zoom, keyboard nudge.
- Layers: reorder/reparent/hide/lock; labels make sense.
- Components tab: search + drop preview; drop at pointer with default size/position.
- Inspector: Framer-like groups; safe style allowlist.
- Storefront: pickup works; cart sidebar is Sheet with item cards; labels editable; prefab instance works live; revalidation correct.

## H) Storefront QA Script (Manual)
1) Admin: toggle delivery modes; reload checkout → modes list matches.
2) Checkout: select Pickup; place order → succeeds without address. Select Delivery → requires address.
3) Navbar cart: opens sidebar Sheet; close via X/overlay/Escape; state updates.
4) Sidebar shows items via CartItemCard; totals render; checkout button text editable.
5) PrefabInstance page renders on live storefront (not just builder preview).
6) Builder: drag new component → appears at pointer with left/top set; snaplines show; resize handles work; undo/redo works.
