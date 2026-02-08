# bindingmanager.md — Binding Editor (Builder) Plan + Spec

Goal: add a production-safe “Bindings” editor to the storefront builder so users can map component props to runtime data paths (schema-aware), Framer-like.

This must work for:
- Product cards (prefabs) and PDP templates (product/custom schemas)
- Collection pages (repeaters: item scope)
- Orders/profile/checkout forms (user/cart/settings/store bindings)

Non-goals:
- No expressions, no JS, no computed formulas in bindings.
- No fetching inside registry components.

---

## 1) Mental model (what bindings are)

Each node has:
- `props`: static values saved in the document JSON
- `bindings`: dynamic overrides saved in the document JSON, mapping `propName -> safePath`

Runtime rule (already implemented):
- renderer resolves `resolvedProps = resolveBindings(node.props, node.bindings, context)`
- binding overrides `props[propName]` ONLY when `resolveBinding(path)` returns a value that is NOT `undefined`

Implication:
- a binding path that resolves to `undefined` will fall back to the static `props` value.
- this is desirable for optional data, but the UI must show “binding currently unresolved”.

---

## 2) UX requirements (Framer-ish)

### Inspector tabs
Add a new right-panel tab: `Bindings` between `Props` and `Actions`.

### Bindings panel behavior
For the selected node:
- Show existing bindings as editable rows:
  - Prop key (string)
  - Binding path (string)
  - Status (Valid/Invalid) + “Resolved preview” (optional)
  - Remove binding (trash)
- “Add binding” button:
  - choose prop key (dropdown of known props + free text)
  - enter binding path (with validation + suggestions)
- If a prop has a binding:
  - show a small “Bound” indicator next to that prop in Props panel (optional but recommended)
  - allow “Clear binding” directly from Bindings panel

### Suggestions
- Show suggestions from:
  - registry `bindingHints` for the node type (if present)
  - common roots: `store.*`, `settings.*`, `user.*`, `cart.*`, `route.*`, `uiState.*`
  - repeater scope: `item.*`, `index` (when node is under a repeater scope)
- Schema-aware picker:
  - for product contexts: show `product.customData.<fieldKey>` suggestions based on product schema
  - for collection product cards: show `item.customData.<fieldKey>` suggestions based on product schema

---

## 3) Validation + Safety

Use existing utilities in `lib/storefront/bindings.ts`:
- `validateBindingPath(path)` for format and forbidden keys
- `resolveBinding(path, context)` for preview resolution (never throws)

UI validation rules:
- path empty => invalid
- invalid format => show error
- forbidden keys => show error
- if valid but resolves to `undefined` in current preview context => warn (not error)

Security:
- Never allow paths containing forbidden keys (already blocked).
- Don’t add “context explorer” that reveals secrets (limit roots to the known RuntimeContext keys).

---

## 4) Data needed for schema-aware suggestions

Bindings need access to product schema fields:
- For a PDP template preview:
  - chosen preview product -> productSchemaId -> fetch product schema -> list fields
- For a product card prefab preview:
  - chosen preview product -> schema -> list fields
- For collection page preview:
  - chosen preview product type (schema) -> list fields (or infer from selected product)

Implementation detail:
- Add builder-side “Preview Data Provider”:
  - loads product schemas for the store
  - loads a sample product per schema (or at least one)
  - stores `previewProduct`, `previewSchemaId`, `previewCollectionProducts` in editor store

---

## 5) Implementation plan (code changes)

### A) Types
Update `types/storefront-builder.ts`:
- add `'bindings'` to:
  - `EditorState.activeRightTab` union
  - any other tab unions used by TopBar/Inspector

### B) Editor store helpers (recommended)
In `lib/builder/editor-store.ts`, add helper actions (thin wrappers around updateNode):
- `setBinding(nodeId, propKey, path)`
- `removeBinding(nodeId, propKey)`
- `renameBindingPropKey(nodeId, oldKey, newKey)` (optional)

Keep the canonical structure:
- `node.bindings` is an object map `{ [propKey]: path }`

### C) Inspector UI
In `components/builder/Inspector.tsx`:
- Add `Bindings` tab trigger and content.
- Implement `BindingsPanel`:
  - Read `selectedNode.bindings ?? {}`
  - Render rows:
    - Prop key input (text) OR dropdown
    - Path input with validation
    - “Resolved preview” using `resolveBinding(path, previewRuntimeContext)`
    - Remove row
  - Add row button

### D) Binding path input component (recommended)
Create `components/builder/inputs/BindingPathInput.tsx`:
- input + inline validation message
- suggestion dropdown (typeahead)
- “Insert suggestion” click
- accepts props:
  - `value`, `onChange`
  - `suggestions: string[]`
  - `validate: (path) => { valid, error? }`

### E) Suggestions utilities
Create `components/builder/bindings/suggestions.ts`:
- `getBaseSuggestions(nodeType)` from registry bindingHints + common roots
- `getSchemaSuggestions(schemaFields, prefix)` using `generateBindingPaths(...)`
- (optional) detect repeater scope by walking selection path and checking ancestor node types that provide scope

### F) Preview context wiring (unblocks live binding preview)
Currently builder preview uses an empty mock context (`components/builder/EditorLayout.tsx`).
To make binding preview meaningful:
- load a default preview product and collection products for the store
- set `RuntimeContextProvider pageData` accordingly
- store that preview context in editor store so BindingsPanel can resolve binding previews

(Without this, bindings editor can still exist, but “resolved preview” will mostly be undefined.)

---

## 6) How it should work for ProductCard specifically

When editing the ProductCard prefab:
- Selecting an Image node:
  - user can bind `src` to `item.images[0].url` (collection) or `product.images[0].url` (PDP) depending on prefab usage.
- Selecting a Text/Heading node:
  - bind `text` to `item.name` or `product.name`
- Schema fields:
  - provide a picker listing schema custom fields:
    - `item.customData.<fieldKey>`
    - `product.customData.<fieldKey>`

Recommended: show a “Context mode” toggle in BindingsPanel:
- “Use item.* (grid)” vs “Use product.* (PDP)”
This just changes suggestion prefixes; it does NOT change binding rules.

---

## 7) Acceptance criteria

- New `Bindings` tab exists in inspector.
- User can add/edit/remove binding entries on any node.
- Paths are validated using validateBindingPath (no expressions).
- Schema-aware field suggestions appear when editing PDP templates or product card prefabs.
- Builder preview uses a default product so bindings can be verified visually.
- Documents save/publish with bindings preserved.
