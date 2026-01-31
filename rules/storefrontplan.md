# Storefront Builder Implementation Blueprint

## Goal Description
Design and implement a Framer-like visual editor for e-commerce storefronts. The editor must be a strict composition tool that outputs pure JSON layouts, uses a centralized strict component registry, and forbids arbitrary JavaScript execution or ad-hoc components.

## User Review Required
> [!IMPORTANT]
> **Strict Paradigm Compliance**: The design rigidly follows the "Everything is a Node" and "No Business Logic in Components" rules.
> **Action System**: Buttons only reference Action IDs. Logic is verified server-side.
> **Schema Binding**: Bindings are static strings (e.g., `product.name`) resolved at runtime.

## System Design Blueprint

### 1. Editor Architecture

```mermaid
graph TD
    subgraph Editor ["Visual Editor (Builder)"]
        Canvas[Canvas Editor] <-->|Mutates| LayoutJSON[Layout JSON]
        Inspector[Inspector Panel] <-->|Mutates| LayoutJSON
        Tree[Layers Tree] <-->|Mutates| LayoutJSON
        
        AssetMgr[Asset Manager] -->|Provides Media| Canvas
        CompReg[Component Registry] -->|Definitions| Canvas
        CompReg -->|Prop Schemas| Inspector
    end

    subgraph Storage
        LayoutJSON -->|Save (Scoped by storeId)| DB[(PostgreSQL)]
    end

    subgraph Runtime ["Storefront Runtime (SSR)"]
        DB -->|Load Layout| LayoutEngine[Layout Engine]
        Ctx[Context Providers] -->|Inject Data| LayoutEngine
        
        LayoutEngine -->|Resolve Bindings| ResolvedProps[Resolved Props]
        LayoutEngine -->|Attach Actions| HydratedTree[Hydrated React Tree]
        
        ActionReg[Action Registry] -->|Handlers| HydratedTree
    end

    Ctx -->|Product/Cart/User/Store| LayoutEngine
```

### 2. Component Registry Structure

Components are strictly typed and registered centrally. Ad-hoc components are impossible.

```typescript
// types/builder.ts

type ComponentCategory = 'layout' | 'content' | 'commerce';

interface ComponentDefinition<P = any> {
  type: string;
  category: ComponentCategory;
  displayName: string;
  icon?: string;
  
  // Strict Schema for Props (for Inspector)
  propsSchema: JSONSchema7; 
  
  // Schema for Style editing (e.g. margin, padding, colors)
  styleSchema: JSONSchema7;
  
  // Allowable fields for data binding
  bindingSchema?: JSONSchema7; 
  
  // Definition of slots where Actions can be attached
  actions?: ActionSlot[];
  
  // React Component Implementation
  render: (props: P, context: RenderContext) => React.ReactNode;
}

interface ActionSlot {
  name: string; // e.g. "onClick"
  label: string;
}
```

### 3. Layout JSON Schema

The layout is a pure JSON tree.

```typescript
interface LayoutRoot {
  page: 'HOME' | 'PDP' | 'CART' | 'CHECKOUT' | 'COLLECTION';
  storeId: string;
  version: string;
  tree: LayoutNode;
}

interface LayoutNode {
  id: string; // UUID
  type: string; // Matches ComponentDefinition.type
  
  // Static user-configured values
  props: Record<string, any>; 
  
  // Visual styles (referencing theme vars)
  styles: Record<string, any>; // e.g. { padding: "2rem", backgroundColor: "var(--primary)" }
  
  // Dynamic bindings
  bindings: Record<string, string>; // e.g. { "title": "product.name" }
  
  // Action configurations
  actions: Record<string, ActionRef>; 
  
  // Recursive children
  children: LayoutNode[];
}

interface ActionRef {
  actionId: string; // e.g. "ADD_TO_CART"
  payload: Record<string, any>; // Static arguments e.g. variantId mapping
}
```

### 4. Action Registry Design

Actions are declarative and safe.

```typescript
// runtime/actions.ts

type ActionID = 
  | 'ADD_TO_CART' 
  | 'BUY_NOW' 
  | 'SELECT_VARIANT' 
  | 'SET_DELIVERY_MODE' 
  | 'APPLY_DISCOUNT' 
  | 'OPEN_DRAWER';

interface ActionDefinition {
  id: ActionID;
  label: string;
  payloadSchema: JSONSchema7;
  // returns generic promise
  handler: (payload: any, context: RuntimeContext) => Promise<void>;
}
```

### 5. Runtime Renderer Flow

1. **Load**: Server fetches `LayoutRoot` for the requested route + `storeId`.
2. **Context**: Server fetches required data (e.g. `Product` if PDP).
3. **Traverse**: `LayoutEngine` recursively walks the `tree`.
4. **Resolve**:
   - For each node:
     - Merge `props` with `styles`.
     - Resolve `bindings`: If `bindings.title` is `product.name`, lookup `product.name` in Context and override `props.title`.
5. **Hydrate**:
   - Look up component implementation in `ComponentRegistry` via `type`.
   - Attach event listeners for configured `actions` (using `ActionRegistry`).
6. **Render**: Return React Tree.

### 6. Example JSON Layout

**Scenario**: Hero Section with H1 bound to Product Name, Product Card with Image/Price, and Add To Cart Button.

```json
{
  "page": "PDP",
  "storeId": "store_01",
  "version": "1.0",
  "tree": {
    "id": "root",
    "type": "Container",
    "props": { "maxWidth": "1200px" },
    "styles": { "margin": "0 auto" },
    "children": [
      {
        "id": "node_1",
        "type": "Hero",
        "props": {
          "title": "Default Title", 
          "subtitle": "Best check out this item"
        },
        "bindings": {
          "title": "product.name",
          "subtitle": "product.description"
        },
        "styles": { "padding": "4rem 0" },
        "children": []
      },
      {
        "id": "node_2",
        "type": "ProductCard",
        "props": { "showBorder": true },
        "bindings": {
          "image": "product.images[0].url",
          "price": "product.variants[0].price"
        },
        "styles": {},
        "children": [
           {
             "id": "node_3",
             "type": "Button",
             "props": { "label": "Add To Cart" },
             "styles": { "element": "primary" },
             "actions": {
               "onClick": {
                 "actionId": "ADD_TO_CART",
                 "payload": { "variantId": "{{product.variants[0].id}}" }
               }
             },
             "children": []
           }
        ]
      }
    ]
  }
}
```

## Proposed Changes

### Phase 1: Foundation
#### [NEW] [builder-types.ts](file:///home/aravind/webdev/ecom/types/builder.ts)
- Define `ComponentDefinition`, `LayoutNode`, `ActionDefinition` interfaces.
- Define strict Action ID enums.

#### [NEW] [registry.tsx](file:///home/aravind/webdev/ecom/lib/builder/registry.tsx)
- Create the singleton `ComponentRegistry`.
- Implement `registerComponent()` function.
- Register core layout components (Container, Grid, Flex).

#### [NEW] [actions.ts](file:///home/aravind/webdev/ecom/lib/builder/actions.ts)
- Implement `ActionRegistry`.
- Define handlers for `ADD_TO_CART`, etc.

### Phase 2: Runtime Engine
#### [NEW] [renderer.tsx](file:///home/aravind/webdev/ecom/components/builder/renderer.tsx)
- Implement `RuntimeRenderer` component.
- Implement `BindingResolver` logic (safe object property access).
- Implement `ActionDispatcher`.

### Phase 3: Visual Editor
#### [NEW] [canvas.tsx](file:///home/aravind/webdev/ecom/app/admin/builder/canvas.tsx)
- Implement Drag & Drop using `dnd-kit` or `@craftjs/core` (if compatible with strict JSON) or custom logic. *Note: Using custom logic or strict wrapper over dnd-kit is preferred to maintain purity.*
- Implement `SelectionModel` state.

#### [NEW] [inspector.tsx](file:///home/aravind/webdev/ecom/app/admin/builder/inspector.tsx)
- Create property controls based on `propsSchema`.
- Create style controls based on `styleSchema`.

## Verification Plan

### Automated Tests
- **Registry Test**: Verify that registered components can be retrieved and match the schema.
- **Resolver Test**: Create a mock Context and Layout Node with bindings. Verify `BindingResolver` correctly extracts values.
- **Serialization Test**: Verify a component tree serializes to valid strict JSON and deserializes back.

### Manual Verification
- **Editor Flow**:
    1. Drag a `Container` to canvas.
    2. Drag a `Button` inside.
    3. Modify `Button` label in Inspector.
    4. Save format check: Inspect console/network to ensure clean JSON payload is sent.
- **Runtime Flow**:
    1. Load the saved layout on a test route.
    2. Click Button -> Expect Console Log (Action triggered).
