# Storefront Builder — Developer Guide

Audience: engineers extending the storefront builder and runtime.

## Architecture recap
- Documents: StorefrontDocument(kind: LAYOUT | PAGE | TEMPLATE | PREFAB, key, status, tree JSON).
## Runtime context (must provide)
- store, settings, user, cart, route, uiState, collection, facets, product, similarProducts, orders.
- uiState: selectedVariantId, deliveryMode, activeFilters, searchQuery.
## Registry contract
- Node: { id, type, props, styles, bindings, actions, children }.
- Bindings: safe path strings only (a.b.c / a.b[0].c). Forbid expressions and prototype keys.
- Styles: StyleObject schema (base + breakpoints + states) with a whitelist of CSS props.
- Actions: named slots mapped to ActionRef (actionId, payload, payloadBindings?).
- Constraints: per component allowed children/usage (e.g., Slot only in layouts; Spacer/Divider have no children).
## Adding a new component to the registry
1) Define component renderer (pure, prop-driven) under `lib/storefront/registry.tsx` or a split module.
2) Add metadata:
   - type key (unique string)
   - displayName/category
   - propsSchema (zod or JSON schema for inspector)
   - styleSchema reference
   - bindingHints (what props can be bound and typical paths)
   - constraints (allowed children, required context)
   - defaults (props/styles/children/actions)
3) Ensure it is deterministic and side-effect free (no fetch inside the component; runtime provides data via props/bindings).
4) If repeater, provide scope variables (`item`, `index`).
5) Export in the registry map; update palette definitions in the builder UI.
## Actions
- Implement action registry in `lib/storefront/actions/registry.ts` with zod schemas and handlers.
- Supported actionIds:
  - ADD_TO_CART { variantId?, quantity?, openCart? }
  - BUY_NOW { variantId?, quantity? }
  - SELECT_VARIANT { variantId }
  - SET_DELIVERY_MODE { mode }
  - APPLY_DISCOUNT { code }
  - OPEN_CART_SIDEBAR { open }
  - NAVIGATE { href, replace? }
- Action dispatcher (server action or API route) must:
  - resolve storeId from path/slug
  - enforce auth/ownership (cart user/session; store isolation)
  - validate payload with zod
  - return normalized data (cart, redirects, ui hints)
- In nodes, actions are attached to explicit slots (e.g., onClick). payloadBindings let you reference context (e.g., selectedVariantId).
## Bindings
- Resolver lives in `lib/storefront/bindings.ts`: safe getter, no proto pollution, never throws, returns undefined when missing.
- Editor should expose schema fields for product/variant schema bindings to help users pick `product.customData.<fieldKey>`.
## Theme
- Theme editor uses tweakcn-ui to edit token map (CSS vars). Draft/publish lives in StorefrontTheme.
- Runtime injects published vars in app/store/[slug]/layout.tsx (scoped to storefront root wrapper to avoid admin bleed).
## Documents lifecycle
- Draft: editable; not live.
- Publish: move/copy draft to published status for that doc/theme in a transaction.
- Unique constraint: ([storeId, kind, key, status]) to allow one draft and one published per key.
## Storefront routing (path-based)
- Pages under app/store/[slug]/... load published documents + theme and render via the registry renderer.
- PDP template selection: match productSchemaId; fallback PDP:default.
## Adding new pages/templates
- Create a new StorefrontDocument with kind PAGE or TEMPLATE, set key, create initial tree using existing components.
- Register in the builder’s document picker.
## Prefabs
- Prefab documents (kind PREFAB) store a tree. PrefabInstance nodes reference prefabId and can have overrides.
- Renderer expands prefab; editor supports create-from-selection, detach, and edit prefab.
## Validation to enforce in builder
- Node type exists in registry.
- Slot only inside layout docs; layout must contain exactly one Slot.
- Spacer/Divider: no children.
- PrefabInstance references existing prefab in same store.
- LayoutRefs list is ordered; all referenced layouts must exist and contain Slot.
- Actions must match registry action IDs and payload schemas.

## Testing targets
- Binding resolver: safe paths, blocked proto keys.
- Action schemas: zod validation for all action payloads.
- Document validation: invalid node types, missing Slot, bad children constraints should be caught at save/publish.

## Performance notes
- Memoize renderer output; avoid full-tree rerenders on small edits.
- Keep stable node IDs; history diff uses IDs.
- Lazy-load heavy inspector panels if necessary.
