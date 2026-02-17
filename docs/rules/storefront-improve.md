# Antigravity Implementation Plan: Framer-Like (Framely-style) Freeform Builder UX

Reference UX + patterns: https://github.com/belastrittmatter/Framely  
Mode decision: **Freeform-first** (absolute positioning by default; Framer-canvas style)

This repo already has:
- Builder shell: `components/builder/EditorLayout.tsx`
- Canvas + selection overlay (partial): `components/builder/Canvas.tsx`
- Inspector (props/styles/bindings/actions/theme) + children reorder: `components/builder/Inspector.tsx`
- Layers tree (read-only, context menu): `components/builder/LayerTree.tsx`
- Registry-driven components: `lib/storefront/registry/*`
- Runtime context + uiState + actions: `lib/storefront/runtime/context.tsx`, `lib/storefront/actions/*`
- Renderer adds `data-node-id` to elements: `lib/storefront/runtime/renderer.tsx`

Goal: Make builder feel like Framer (and closer to Framely’s editor UX):
- Freeform canvas with direct manipulation (move/resize/rotate later), snapping + guides
- Layers panel as primary navigation (collapse/expand, drag reorder, reparent)
- Components tab designed like a real library (search, categories, drag to canvas with insertion preview)
- Inspector reworked into “Transform / Appearance / Typography / Effects” (Framely-style)
- Ensure storefront runtime uses the same component behaviors (no editor-only hacks)

---

## A) Non-Negotiable Fixes (Current Functional Breaks)

### A1) Pickup checkout must not fail order creation
Problem:
- UI hides shipping address for pickup in `lib/storefront/registry/forms.tsx`
- API still requires shippingAddress in `app/api/customer/orders/create/route.ts`

Do:
- Update `app/api/customer/orders/create/route.ts`:
  - Accept `deliveryMode` (`'DELIVERY'|'PICKUP'`)
  - If deliveryMode === 'PICKUP': shippingAddress is optional and not validated
  - If deliveryMode === 'DELIVERY': keep strict shipping validation
- Ensure checkout submit passes deliveryMode (prefer explicit payload, not only implicit uiState):
  - Update `lib/storefront/actions/handlers.ts` (order creation handler) to include `context.uiState.deliveryMode`
  - Update any client request payload shape as needed

Acceptance:
- Pickup checkout completes successfully with no address required.
- Delivery checkout still requires address.

### A2) Remove cart redirect hack; use real cart sidebar open/close
Problem:
- `components/storefront/runtime/CartHandler.tsx` redirects to `/cart` whenever `uiState.cartSidebarOpen` becomes true.
- This prevents a real sidebar experience and breaks “Framer-like” UI expectation.

Do:
- Stop rendering `CartHandler` in `app/store/[slug]/_components/StorefrontPage.tsx`
- Implement real sidebar (see Cart section) and make close work.

Acceptance:
- Clicking cart opens a sidebar/sheet; no navigation happens.

### A3) Storefront settings revalidation uses storeId in URL, but storefront uses slug
Problem:
- `app/admin/stores/[storeId]/(dashboard)/settings/storefront/actions.ts` calls `revalidatePath(/store/${storeId})`
- Storefront URLs are `/store/${slug}`

Do:
- In that action, lookup the store slug from storeId and revalidate:
  - `/store/${slug}`
  - `/store/${slug}/checkout`

Acceptance:
- Admin toggles affect storefront without manual refresh or cache issues.

---

## B) Core Architecture Decision (Freeform-First)

### B1) Coordinate system
- The canvas “page” is a **positioning context** (`position: relative`) and all inserted nodes default to `position: absolute`.
- Left/top/width/height live in `node.styles.base` as px strings:
  - `left: "120px"`, `top: "80px"`, `width: "320px"`, `height: "180px"`
- Stacking order:
  - Default = order in parent `children[]` (last = top)
  - Optional: `zIndex` for manual override

### B2) Containers vs Frames
To keep freeform usable and nestable:
- Introduce a “Frame” concept: a container that is itself a positioning context.
- Rule:
  - Any node can be a positioning context if it has `styles.base.position === "relative"` (or a dedicated prop).
- Recommendation:
  - Add a `Frame` registry component (or augment `Container`) with “Freeform children” behavior:
    - `position: relative`
    - children default to absolute inside it

### B3) Migration/Defaults
- When inserting a component from palette:
  - Assign default size and position automatically (see insertion below)
  - If component definition doesn’t specify default width/height, fallback to:
    - width: 240px
    - height: 80px (or `auto` for text-only components, but then set a minHeight)
- Existing docs created before freeform:
  - Do not break them; only apply “freeform defaulting” on newly inserted nodes unless user explicitly toggles to freeform.

---

## C) Builder UX Workstreams (Modeled After Framely)

### WT1: Builder Layout UI (Left/Canvas/Right) like Framer
Target:
- Left sidebar: **Components** tab + **Layers** tab (Framely has these)
- Center: canvas with zoom + device sizes
- Right sidebar: inspector with grouped sections and fewer tabs

Current files:
- `components/builder/EditorLayout.tsx` already has left tabs and right panel.

Do:
- Replace left sidebar buttons with a real tab UI (still fine if it stays buttons).
- Add left sidebar header:
  - Search field for components (Components tab)
  - Document tree filter/search (Layers tab)
- Add a “canvas toolbar” above canvas:
  - Select / Hand (pan) tool
  - Snap toggle, Grid toggle
  - Zoom control + Fit to screen

Acceptance:
- The shell feels like an editor, not a settings form.

---

## WT2: Canvas Interaction Engine (Framer-like move/resize + snapping)
This is the biggest “Framer feel” difference.

### WT2.1 Hover + Selection chrome
Do:
- Add hover outline (light) when moving mouse over elements (based on `data-node-id`).
- Selection outline:
  - label chip (type + friendly name)
  - handles

Acceptance:
- You can tell what you’re about to select without clicking.

### WT2.2 Direct manipulation
Do in `components/builder/Canvas.tsx` (or split into helper modules):
- Drag move for nodes with `position: absolute` OR `fixed`.
- On drag start:
  - If left/top are missing, compute them from element’s current rect relative to its offsetParent and set them immediately (prevents snapping to 0,0).
- Resize:
  - 8 handles: N/S/E/W + corners
  - Shift = lock aspect ratio (corner handles)
  - Alt = resize from center
- Keyboard:
  - Arrow = 1px move
  - Shift+Arrow = 10px move
- Multi-select (optional phase 2):
  - shift-click to add selection
  - group bounding box transforms

Acceptance:
- No “jumping” on first drag.
- Resize feels stable and predictable.

### WT2.3 Snapping, grid, guides
Implement snapping rules:
- Snap to grid (default 8px)
- Snap to parent edges and center
- Snap to sibling edges and centers
- Show guide lines when snapping (Framer-style blue lines)

Acceptance:
- Moving feels “magnetic” and aligned.

### WT2.4 Pan/zoom like design tools
Do:
- Space + drag = pan
- Ctrl/Cmd + wheel = zoom to pointer
- Fit-to-screen button

Acceptance:
- You can navigate large canvases comfortably.

---

## WT3: Layers Panel: Make it “Editor grade”
Current `components/builder/LayerTree.tsx` is read-only with context menu.

Upgrade it to match Framely patterns (reference `Framely/src/.../layers-tab/index.tsx`):
- Expand/collapse
- Select on click (already)
- Drag-drop reorder in same parent
- Drag-drop reparenting into containers/frames (only if target allows children)
- Visibility toggle (Eye icon):
  - Add `node.props.hidden` (or `node.meta.hidden`) and ensure renderer respects it
- Lock toggle:
  - Add `node.props.locked`
  - Locked nodes can’t be moved/resized/selected on canvas (only via layers)

Also improve labeling:
- Display name priority:
  1) `node.props.name` (if present)
  2) registry `displayName`
  3) `node.type`
- Secondary label:
  - if `props.text`, show a short preview (already does something like this)

Acceptance:
- Layers becomes primary navigation and composition tool.

---

## WT4: Components Tab: Library-like UX + “drop with preview”
Current `components/builder/ComponentPalette.tsx` is a basic accordion list.

Make it feel like Framely’s Components tab:
- Search input at top (filters by displayName/type/category)
- Category headers with counts
- Each component item:
  - icon
  - name
  - short description (optional, can come from definition)
  - drag handle + click-to-insert button

Drop experience (critical):
- When dragging from palette:
  - highlight valid drop targets on canvas (frames/containers)
  - show insertion ghost at computed position
- Drop position for freeform:
  - if dropping on canvas root or frame:
    - set new node left/top based on pointer coordinate within that context
  - default width/height from definition (fallback values if missing)

To implement proper drop targets:
- Introduce a **builder-only wrapper** around each rendered node that can act as a droppable area.
  - Renderer currently renders registry components directly.
  - Add a `wrapNode` option (builder only) to `Renderer`/`RendererWithLayout` OR create a `BuilderRenderer` that recursively renders nodes and wraps them (Framely has `ElementWrapper` doing selection chrome).

Recommended approach:
- Add `BuilderRenderer` that:
  - resolves bindings/styling the same way
  - wraps each node in a wrapper div with:
    - `data-node-id`
    - droppable target registration (dnd-kit)
    - pointer handlers (hover/select)
  - then renders the actual component inside

Acceptance:
- Drop feels intentional; users see where the item will land.

---

## WT5: Inspector: Rebuild into Framer-like grouped sections
Current inspector uses tabs: Props / Styles / Bind / Act / Theme.

Framer-like approach:
- Keep top-level tabs minimal:
  - Design (Transform/Appearance/Typography/Effects)
  - Content (component props)
  - Data (bindings)
  - Actions
  - Theme

### WT5.1 Transform section (must match Framely feel)
Reference: `Framely/.../transform-settings.tsx`

Fields:
- Position:
  - X (left), Y (top)
  - W (width), H (height)
  - Rotation (phase 2)
- Layout:
  - position type: static/relative/absolute/fixed
  - zIndex
- Spacing:
  - margin (t/r/b/l)
  - padding (t/r/b/l)

UI details:
- Use numeric inputs with unit dropdown (px/%/auto where allowed)
- Add “link” toggle for padding/margin to edit all sides together
- Show computed values read-only when unset (optional)

### WT5.2 Appearance
- Background color, border, radius, shadow, opacity

### WT5.3 Typography
- font family, size, weight, line height, letter spacing, align

Important constraints:
- Do not allow styles outside `lib/storefront/styles.ts` allowlist.

Acceptance:
- Most common edits are 1–2 clicks away.
- Inspector feels like a design tool, not raw CSS.

---

## D) Storefront UX: Cart Sidebar + Cart Card + Editable Labels

### WT6: Implement a real shadcn “Sheet” sidebar and use it for CartSidebar
Current repo has `components/ui/dialog.tsx` but no `sheet.tsx`.

Do:
- Add `components/ui/sheet.tsx` (Radix Dialog-based sheet) using Framely’s `src/components/ui/sheet.tsx` as reference.
- Update `lib/storefront/registry/commerce.tsx` `CartSidebar`:
  - render a Sheet from the right
  - control via `isOpen`
  - close via:
    - `onClose` prop if provided
    - otherwise default to `setUIState('cartSidebarOpen', false)` using `useRuntimeContext()`
  - overlay click closes
  - Escape closes

Acceptance:
- Cart opens as a sidebar sheet; it closes reliably.

### WT7: Create `CartItemCard` component in registry
Do in `lib/storefront/registry/commerce.tsx`:
- New component type: `CartItemCard`
- Props/bindings:
  - `item` (CartItemContext)
  - `currency`
- Optional controls:
  - showImage, showQuantity, showRemove, showVariant
- Use it inside CartSidebar by mapping items -> cards.

Acceptance:
- Sidebar shows a consistent list of items and totals.
- Same component can be used on Cart page.

### WT8: Ensure button text + labels are editable (no hardcoded UI strings)
You already have an editable `Button` registry component:
- `lib/storefront/registry/content.tsx` supports `text` control.

Now remove hardcoded labels in custom components:
- `lib/storefront/registry/navigation.tsx`:
  - Replace hardcoded “Account” and cart icon-only with editable props/controls:
    - `accountLabel`, `cartLabel` (or `showCartLabel`)
    - `showAccount`, `showCart`
    - `cartIcon` should use your registry Icon component if possible
- `lib/storefront/registry/commerce.tsx` CartSidebar:
  - make “Checkout” button text editable (prop/control)
- `lib/storefront/registry/forms.tsx` DeliveryModeSelector:
  - allow editable labels for DELIVERY/PICKUP or render as children nodes

Preferred “fully customizable” approach:
- Make Navbar and CartSidebar primarily prefab-driven (editable structure):
  - Use `lib/storefront/defaults/prefabs/navbar.ts` and `lib/storefront/defaults/prefabs/cart-sidebar.ts`
  - Use `PrefabInstance` (`lib/storefront/registry/utility.tsx`) to render them
  - Ensure runtime passes `prefabs` map into context (see next)

Acceptance:
- Any visible text in these UI blocks can be edited via builder without code.

---

## E) Runtime Parity: Prefabs must work in live storefront
`PrefabInstance` expects `context.prefabs[prefabKey]`.

Do:
- Ensure storefront routes load prefabs map:
  - use `services/storefront.service.ts#getPublishedPrefabs`
- Pass prefabs into runtime:
  - `RuntimeContextProvider` already supports `pageData.prefabs` in `lib/storefront/runtime/context.tsx`
  - Ensure `app/store/[slug]/*` pages pass `pageData={{ prefabs }}` OR `StorefrontPage` takes a `prefabs` prop and wires it into pageData.

Acceptance:
- PrefabInstance works on real storefront, not just builder preview.

---

## F) Concrete File-Level Change List (This Repo)

Builder UX:
- `components/builder/EditorLayout.tsx` (toolbar + left/right panel UX polish)
- `components/builder/Canvas.tsx` (interaction engine: hover/select/move/resize/snap/pan/zoom)
- `components/builder/LayerTree.tsx` (drag reorder + reparent + hide/lock + better labels)
- `components/builder/ComponentPalette.tsx` (search + better items + insertion affordances)

Recommended new builder-only modules:
- `lib/builder/interactions/coords.ts` (client->canvas coordinate transforms, zoom scaling)
- `lib/builder/interactions/snap.ts` (snap computations + guide lines)
- `lib/builder/interactions/resize.ts` (handle math + modifiers)
- `lib/builder/renderer/BuilderRenderer.tsx` (wrap nodes, droppable, hover/select)
  - Alternative: add `wrapNode` support to `lib/storefront/runtime/renderer.tsx`

Storefront UX:
- `components/ui/sheet.tsx` (new shadcn component)
- `lib/storefront/registry/commerce.tsx` (CartSidebar -> Sheet; add CartItemCard)
- `lib/storefront/registry/navigation.tsx` (editable labels; optional icon control)
- `lib/storefront/registry/forms.tsx` (editable delivery mode labels if required)

Functional fixes:
- `app/api/customer/orders/create/route.ts` (pickup logic)
- `app/admin/stores/[storeId]/(dashboard)/settings/storefront/actions.ts` (revalidate slug paths)
- `app/store/[slug]/_components/StorefrontPage.tsx` (remove CartHandler usage)

Runtime parity:
- `services/storefront.service.ts` (use existing `getPublishedPrefabs`)
- `app/store/[slug]/*` pages (load + pass prefabs)

---

## G) Implementation Order (Minimize Rework)

1) A1/A2/A3 fixes (pickup order, remove cart redirect hack, correct revalidation)
2) WT6/WT7/WT8 (Sheet cart sidebar + CartItemCard + editable labels)
3) Prefab runtime parity (prefabs passed into context)
4) Builder core engine (WT2 canvas interactions)
5) WT3 layers dnd + reparenting
6) WT4 components tab drop preview + insertion placement
7) WT5 inspector rebuild (Framer-like groups)

---

## H) Acceptance Criteria (Definition of Done)

Canvas (freeform):
- Select, move, resize absolute nodes without jump
- Snap to grid/edges/centers; guides show while snapping
- Pan/zoom like a design tool; fit-to-screen works
- Keyboard nudging works

Layers:
- Expand/collapse, drag reorder, reparenting
- Hide/lock nodes affect canvas interactions

Components tab:
- Search and categories
- Drag from palette shows a placement preview and drops at pointer coordinate

Inspector:
- Transform/Appearance/Typography groups
- Editing values updates node styles immediately
- No unsafe style properties outside allowlist

Storefront:
- Cart opens as a real sidebar sheet and closes
- Cart list uses CartItemCard component
- Pickup checkout works end-to-end
- Hardcoded labels replaced by editable props or prefab nodes
- PrefabInstance works on live storefront

---

## Optional Phase 2 (If you want even closer to Framer)
- Rotation handle + numeric rotate input
- Multi-select + group bounding box transforms
- Alignment tools (align left/center/right; distribute)
- Rulers + measurement overlays
- Constraints/pinning (left/right/top/bottom) for responsive behavior