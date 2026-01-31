# Storefront Builder System Plan (Strict JSON + Registry + Safe Actions)

Design and implement a Framer-like visual editor for e-commerce storefronts that outputs pure JSON layouts, uses a strict centralized registry, and forbids arbitrary JS / ad-hoc components.

## Non-Negotiable Rules
- **Everything is a Node**: UI is a JSON tree of `LayoutNode`s; the JSON is the single source of truth.
- **No Business Logic in Components**: registry components render props only; they never fetch, mutate cart, or call APIs directly.
- **Bindings Are Strings**: `bindings` values are static strings (e.g. `product.name`), resolved by a safe resolver against a provided runtime context.
- **Actions Are Declarative**: nodes reference `actionId` + schema-validated payload; server verifies permissions and executes handlers.
- **No Arbitrary Execution**: no eval, no inline code, no user scripts, no dynamic component injection.

---

## System Overview

### Editor (Builder) Responsibilities
- Create/edit a `LayoutRoot` JSON document per `{storeId, page}`.
- Render the JSON on a Canvas using the **same registry** as runtime (in "editor mode").
- Provide a Layers tree, Inspector (schema-driven), Asset manager, and save/publish/version flows.
- Enforce schema validation and registry constraints (nesting rules, bindable props, allowed actions).

### Runtime (Storefront) Responsibilities
- Load the published layout for `{storeId, route/page}`.
- Fetch route-scoped data to build `RuntimeContext` (store, user, cart, product, collection, etc.).
- Traverse nodes, resolve bindings safely, attach actions, and render registry components.
- Execute actions through a validated server action endpoint.

---

## Data Model (Source of Truth)

### LayoutRoot
- `storeId: string`
- `page: 'HOME' | 'PDP' | 'CART' | 'CHECKOUT' | 'COLLECTION'`
- `version: string` (semantic or incrementing)
- `status: 'draft' | 'published' | 'archived'`
- `tree: LayoutNode`
- `meta: { createdAt, updatedAt, updatedBy, publishedAt? }`

### LayoutNode
- `id: string` (uuid)
- `type: string` (registry key)
- `props: Record<string, any>` (static configuration)
- `styles: StyleObject` (visual styling only; schema-constrained)
- `bindings: Record<string, string>` (propName -> binding path string)
- `actions: Record<string, ActionRef>` (slot -> action)
- `children: LayoutNode[]`

### ActionRef
- `actionId: ActionID`
- `payload: Record<string, any>` (schema-validated; prefer static only)
- Optional: `analytics?: { eventName?: string }`

---

## Component Registry (Strict, Centralized)

### ComponentDefinition
- `type: string`
- `category: 'layout' | 'content' | 'commerce' | 'navigation'`
- `displayName: string`
- `icon?: string`
- `propsSchema: JSONSchema7` (Inspector controls)
- `styleSchema: JSONSchema7` (Inspector controls)
- `bindingSchema?: JSONSchema7` (allowed bind targets; allowed roots)
- `actions?: ActionSlot[]` (e.g. `onClick`, `onSubmit`)
- `constraints?: {`
  - `isContainer?: boolean`
  - `allowedChildren?: string[] | 'ANY_REGISTERED'`
  - `disallowChildren?: boolean`
  - `maxChildren?: number`
  - `requiredChildrenTypes?: string[]`
  - `}`
- `render(props, context): ReactNode` (pure render)

### ActionSlot
- `name: string` (e.g. `onClick`)
- `label: string`

---

## Action Registry (Safe, Verified)

### ActionDefinition
- `id: ActionID`
- `label: string`
- `payloadSchema: JSONSchema7`
- `handler(payload, runtimeContext): Promise<ActionResult>`

### Minimum Action IDs (MVP)
- `ADD_TO_CART`
- `BUY_NOW`
- `SELECT_VARIANT`
- `APPLY_DISCOUNT`
- `SET_DELIVERY_MODE`
- `OPEN_DRAWER`
- `NAVIGATE` (optional; for Link/Button navigation without custom code)

### Action Dispatch Contract
Client sends:
- `{ storeId, page, layoutVersion, nodeId, actionId, payload }`

Server enforces:
- action exists
- payload schema passes
- permissions pass (store access, cart ownership, product availability)
- handler executes and returns normalized result (e.g. updated cart, redirect intent)

---

## Runtime Rendering Pipeline

1. **Load layout**: published by default; draft for authenticated preview.
2. **Validate**: JSON schema + registry type existence + constraints.
3. **Build context**: route-scoped data providers (store/cart/user/product/collection).
4. **Traverse** nodes:
   - `resolvedProps = props`
   - Apply `bindings`: resolve binding path into context; override target prop (or keep static default if undefined).
   - Resolve styles: map `styles` object to allowed CSS/props (tokens allowed).
5. **Render**: `ComponentRegistry[type].render(resolvedProps, renderContext)`
6. **Attach actions**: slot -> dispatcher -> server action endpoint.

### Binding Resolver (Security Requirements)
- Allowed syntax: `a.b.c`, `a.b[0].c`
- Forbidden: function calls, expressions, prototype access (`__proto__`, `constructor`, `prototype`)
- Never throws; missing path yields `undefined`

---

## Visual Editor (Admin Builder)

### Main Screens/Areas
- **Canvas**: live render of JSON (editor mode), selection overlays, drop zones.
- **Layers Tree**: view/reorder hierarchy; drag to reorder; lock/hide toggles (optional).
- **Inspector**: schema-driven editing of Props / Styles / Bindings / Actions.
- **Component Palette**: categorized list from registry.
- **Asset Manager**: upload/select assets; returns stable asset references.
- **Toolbar**: undo/redo, zoom, responsive mode, preview, save, publish.

### Editing Model
All mutations are pure document operations:
- `addNode(parentId, index, nodeTemplate)`
- `moveNode(nodeId, newParentId, index)`
- `duplicateNode(nodeId)`
- `deleteNode(nodeId)`
- `updateProps(nodeId, patch)`
- `updateStyles(nodeId, patch)`
- `updateBindings(nodeId, patch)`
- `updateActions(nodeId, patch)`
- `setSelection(nodeId|null)`

State:
- `selection: nodeId|null`
- `history: past/present/future` (undo/redo)
- `validation: { nodeId -> issues[] }`

---

## Style Editing (Framer-Like, Schema-Driven)

### Goals
- Provide a **clean, highly-defined** style system that feels like Framer: grouped controls, responsive overrides, tokens, and safe outputs.
- All style edits write to `node.styles` (never `props`), and only allow schema-approved keys/values.

### StyleObject Shape (Recommended)
- `styles.base`: default styles for all breakpoints
- `styles.breakpoints`: optional overrides keyed by breakpoint id (e.g. `sm`, `md`, `lg`)
- `styles.states`: optional overrides keyed by state (e.g. `hover`, `pressed`, `focus`, `disabled`)

Example:
```json
{
  "styles": {
    "base": { "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 }, "background": { "type": "color", "value": "var(--surface)" } },
    "breakpoints": { "sm": { "padding": { "left": 16, "right": 16 } } },
    "states": { "hover": { "opacity": 0.92 } }
  }
}
```

### Global Style Groups (Available to Most Components)
Implement these groups as reusable JSON schema fragments so every component can opt-in consistently.

#### 1) Layout
Editable props (common):
- `display`: `block | flex | grid | none` (component-dependent)
- `width`: `auto | px | % | vw | token`
- `height`: `auto | px | % | vh | token`
- `minWidth`, `maxWidth`, `minHeight`, `maxHeight`
- `aspectRatio` (number or `"16/9"`)
- `overflow`: `visible | hidden | scroll | auto`
- `visibility`: `visible | hidden`

#### 2) Spacing
Editable props:
- `margin`: `{top,right,bottom,left}` (px/rem/token)
- `padding`: `{top,right,bottom,left}` (px/rem/token)
- `gap`: (for flex/grid containers)

#### 3) Position
Editable props:
- `position`: `relative | absolute | sticky | fixed` (if allowed)
- `top`, `right`, `bottom`, `left`
- `zIndex`
- `transform`: `{ translateX, translateY, rotate, scaleX, scaleY }` (constrained numeric)
- `transformOrigin` (enum)

#### 4) Flex (for flex containers)
Editable props:
- `flexDirection`: `row | column | row-reverse | column-reverse`
- `justifyContent`: `flex-start | center | flex-end | space-between | space-around | space-evenly`
- `alignItems`: `stretch | flex-start | center | flex-end | baseline`
- `flexWrap`: `nowrap | wrap`
- Per-child (optional advanced): `flexGrow`, `flexShrink`, `flexBasis`, `alignSelf`

#### 5) Grid (for grid containers)
Editable props:
- `columns`: number OR template string (restricted)
- `rows`: number OR template string (restricted)
- `columnGap`, `rowGap`
- `alignContent`, `justifyContent`, `alignItems`, `justifyItems`
- Per-child (optional advanced): `gridColumn`, `gridRow`

#### 6) Background
Editable props:
- `background.type`: `color | gradient | image`
- `background.color`: token or rgba/hex
- `background.gradient`: `{ kind: linear, angle, stops[] }`
- `background.image`: `{ assetId|url, fit: cover|contain, position, repeat }`

#### 7) Border & Radius
Editable props:
- `border.width`, `border.style`, `border.color`
- `border.radius`: `{tl,tr,br,bl}` (px/token)

#### 8) Effects
Editable props:
- `opacity`
- `boxShadow`: preset list or constrained values
- `filter`: `{ blur, brightness, contrast, saturate }` (optional)
- `backdropFilter` (optional; if supported)

#### 9) Typography (for text-like components)
Editable props:
- `fontFamily` (token/allowed list)
- `fontSize`, `lineHeight`, `letterSpacing`
- `fontWeight` (enum or numeric range)
- `textTransform`, `textDecoration`
- `textAlign`
- `color` (token/rgba/hex)
- `clamp`: optional `{ min, preferred, max }` for responsive typography

#### 10) Interaction States (visual only)
Editable props:
- `states.hover`, `states.pressed`, `states.focus`, `states.disabled` overrides of any allowed style keys
- `transition`: `{ property: preset, durationMs, easing }` (restricted to safe presets)
- Note: state styling is **not** business logic; it only affects appearance.

### Component-Specific Style Groups (Examples)
- **Image**: `objectFit`, `objectPosition`, optional `loading` (prop, not style)
- **Button**: variant tokens (`--button-primary`) + typography + padding + radius + hover/pressed state styles
- **Section/Container**: maxWidth, background, padding, border, shadow
- **ProductCard**: layout, border, radius, shadow, hover state

### Inspector UX (Framer-Like)
- Tabs: `Props | Styles | Bindings | Actions`
- Styles panel groups: `Layout`, `Spacing`, `Typography`, `Background`, `Border`, `Effects`, `Position`, `States`, `Responsive`
- Responsive controls:
  - breakpoints selector (Base / Sm / Md / Lg)
  - editing writes into `styles.breakpoints[breakpointKey]`
- Tokens:
  - any color/size/font field supports picking from Theme tokens or entering a raw value (if allowed)

---

## Bindings (Data) Editing
- Bindable props are opt-in per component via `bindingSchema`.
- Binding UI:
  - pick target prop (e.g. `title`)
  - pick binding root (e.g. `product`)
  - pick path (searchable)
- Runtime context roots (example):
  - `store`, `user`, `cart`, `product`, `collection`, `route`

---

## Persistence, Versioning, Publishing

### Storage
- Table: `storefront_layouts`
  - `{ id, storeId, page, version, status, layoutJson(jsonb), updatedAt, updatedBy, publishedAt }`
- Rules:
  - Only one `published` per `{storeId,page}` at a time
  - Draft saves overwrite current draft version or create a new draft version (choose one policy and stick to it)

### Save/Publish Flow
- **Save Draft**: validate -> store JSON
- **Publish**: validate stricter -> mark published -> archive previous published
- **Preview Draft**: authenticated route loads draft version

---

## Feature Inventory (Implementation Checklist)

### Foundation (Must)
- Types + JSON schema for layout, actions, style fragments
- Component registry (singleton) + core component definitions
- Action registry + server dispatch endpoint + validation
- Binding resolver (secure)
- Layout validator (registry + schema + constraints)
- Theme tokens system (colors, typography, spacing, radii, shadows)

### Builder UI (Must)
- Canvas render (editor mode)
- Layers tree (select, reorder)
- Inspector (schema-driven controls for props/styles/bindings/actions)
- Undo/redo
- Asset manager
- Save/publish/preview/version selection
- Validation errors surfaced per node + blocking publish

### Runtime (Must)
- Page routing to `page` enum
- Context providers (store/cart/user/product/collection)
- SSR + hydration-safe rendering
- Action execution with permission checks

### Commerce Components (MVP)
- `ProductTitle`, `ProductPrice`, `ProductImage`
- `VariantSelector` (prop + action hook)
- `AddToCartButton` (action hook)
- `CartSummary` / `CartLineItems`

---

## Testing & Verification

### Automated
- Registry retrieval + schema compatibility
- Binding resolver: allowed paths, forbidden keys, missing behavior
- Renderer: sample layout renders stable tree
- Actions: schema validation + permission checks + expected mutations
- Serialization: JSON round-trip stability

### Manual
- Build PDP layout, bind product fields, style it, save draft, publish
- Visit storefront: published layout loads; actions function
- Preview draft behind auth; errors block publish cleanly

---

## Open Decision (Recommended Default)
**Repeaters (e.g. product grids):**
- Recommended default: implement a strict `Repeater` component with:
  - `props.itemsBinding: string` (e.g. `collection.products`)
  - `props.itemVar: string` (e.g. `item`)
  - one `children[0]` as the template subtree
- This enables real COLLECTION/HOME sections without breaking "Everything is a Node".
