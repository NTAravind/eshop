# Store Builder Architecture

Technical documentation explaining how the storefront builder system works.

---

## Overview

The Store Builder is a visual, JSON-based page builder for Next.js e-commerce applications. It allows users to create and edit storefront pages through a drag-and-drop interface while storing the UI structure as declarative JSON documents.

**Key Design Principles:**
- **Declarative**: UI is data (JSON), not code
- **Dual-mode**: Same documents work in edit mode (visual editor) and runtime mode (live site)
- **Versioned**: Supports V1 (legacy) and V2 (modern) data formats with automatic migration
- **Type-safe**: Heavy TypeScript usage with runtime validation

---

## Core Data Model

### Document Tree

Everything in the builder is represented as a tree of `StorefrontNode` objects:

```typescript
interface StorefrontNode {
    id: string;                    // Unique identifier (e.g., "header_123")
    type: string;                  // Component type (e.g., "Container", "Text")
    props: Record<string, unknown>; // Component properties
    
    // V2 Architecture (preferred)
    bindingMap?: Record<string, BindingExpr>;     // Data bindings (AST)
    styleTokens?: StyleTokenMap;                   // Design token references
    styleOverrides?: ResponsiveStyleOverrides;     // Inline style overrides
    actionMap?: Record<string, ActionPipeline>;    // Action sequences
    
    // V1 (deprecated but supported)
    styles?: StyleObject;
    bindings?: Record<string, string>;
    actions?: Record<string, ActionRef>;
    
    children?: StorefrontNode[];   // Child nodes
    hidden?: boolean;              // Visibility flag
    locked?: boolean;              // Edit protection
}
```

**Example tree:**
```json
{
    "id": "page_root",
    "type": "Container",
    "props": { "tag": "main" },
    "children": [
        {
            "id": "hero_section",
            "type": "Section",
            "props": { "padding": "large" },
            "children": [
                {
                    "id": "hero_heading",
                    "type": "Heading",
                    "props": { "level": 1 },
                    "bindingMap": {
                        "text": {
                            "kind": "path",
                            "root": "pageData",
                            "segments": ["heroTitle"]
                        }
                    }
                }
            ]
        }
    ]
}
```

### Document Storage

Documents are stored by **kind** and **key**:

| Kind | Purpose | Example Keys |
|------|---------|--------------|
| `LAYOUT` | Reusable page wrappers | `GLOBAL_LAYOUT`, `checkout-layout` |
| `PAGE` | Complete pages | `HOME`, `COLLECTION`, `CHECKOUT` |
| `TEMPLATE` | Dynamic page blueprints | `PDP:default`, `PDP:luxury` |
| `PREFAB` | Reusable component trees | `ProductCard`, `Navbar` |

Each document exists in two statuses:
- **DRAFT** - Work in progress, editable via the builder
- **PUBLISHED** - Live version, immutable snapshot used by the storefront

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         EDITOR                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Canvas     │◄──►│ Editor Store │◄──►│  Inspector   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                     │         │
│         └───────────────────┼─────────────────────┘         │
│                             │                               │
│                    ┌──────────────┐                         │
│                    │ Commands.ts  │                         │
│                    │ (Undo/Redo)  │                         │
│                    └──────────────┘                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼ Save/Publish
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE                                │
│         storefrontDocument (tree JSON)                      │
│         storefrontTheme (vars JSON)                         │
└─────────────────────────────┬───────────────────────────────┘
                              │ Load Published
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      RUNTIME                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Renderer   │◄──►│   Context    │◄──►│   Registry   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                     │         │
│         └───────────────────┼─────────────────────┘         │
│                             │                               │
│                    ┌──────────────┐                         │
│                    │  Bindings    │                         │
│                    │   Styles     │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Editor System

### State Management

The editor uses **Zustand** for state management with the following structure:

```typescript
interface EditorState {
    // Document
    documentId: string | null;
    documentKind: 'LAYOUT' | 'PAGE' | 'TEMPLATE' | 'PREFAB' | null;
    tree: StorefrontNode | null;     // The document tree
    isDirty: boolean;                // Unsaved changes flag
    
    // Theme
    theme: ThemeVars;                // Current theme variables
    
    // UI State
    mode: 'edit' | 'preview';        // Edit or preview mode
    device: 'desktop' | 'tablet' | 'mobile';  // Viewport
    zoom: number;                    // Zoom percentage (25-400)
    pan: { x: number; y: number };   // Canvas pan offset
    leftPanelCollapsed: boolean;
    rightPanelCollapsed: boolean;
    activeLeftTab: 'components' | 'layers';
    
    // Selection
    selection: {
        nodeId: string | null;       // Selected node ID
        path: number[];              // Path indices to node
    };
    hoveredNodeId: string | null;    // Node under cursor
    
    // History (Undo/Redo)
    history: HistoryEntry[];         // Stack of tree snapshots
    historyIndex: number;            // Current position in history
    
    // Clipboard
    clipboard: StorefrontNode | null; // Copied node
}
```

### Command System

All mutations happen through a **command bus** pattern. Commands are pure functions that:
1. Return a new tree snapshot (immutable)
2. Generate an inverse command for undo/redo
3. Return success/failure with warnings

**Available commands:**
```typescript
type EditorCommand =
    | { type: 'INSERT_NODE'; parentId: string; index: number; node: StorefrontNode }
    | { type: 'REMOVE_NODE'; nodeId: string }
    | { type: 'MOVE_NODE'; nodeId: string; newParentId: string; newIndex: number }
    | { type: 'UPDATE_PROPS'; nodeId: string; props: Partial<Record<string, unknown>> }
    | { type: 'UPDATE_BINDINGS'; nodeId: string; bindingMap: Record<string, BindingExpr> }
    | { type: 'UPDATE_STYLE_TOKENS'; nodeId: string; tokens: StyleTokenMap }
    | { type: 'UPDATE_STYLE_OVERRIDES'; nodeId: string; overrides: ResponsiveStyleOverrides }
    | { type: 'UPDATE_ACTIONS'; nodeId: string; actionMap: Record<string, ActionPipeline> }
    | { type: 'SET_HIDDEN'; nodeId: string; hidden: boolean }
    | { type: 'BATCH'; commands: EditorCommand[] };  // Atomic multi-operation
```

**Usage example:**
```typescript
import { applyCommand } from '@/modules/builder/commands';

// Insert a new Text node
const command = {
    type: 'INSERT_NODE' as const,
    parentId: 'container_1',
    index: 0,
    node: {
        id: `text_${Date.now()}`,
        type: 'Text',
        props: { text: 'Hello World' }
    }
};

const { snapshot, inverse, success } = applyCommand(currentTree, command);
if (success) {
    setTree(snapshot);           // Update state with new tree
    pushHistory(snapshot, inverse); // Add to undo history
}
```

### Undo/Redo System

- History entries store complete tree snapshots (not diffs)
- Max 50 entries to prevent memory bloat
- Batched commands count as single history entry
- History cleared on document load

### Canvas Interactions

**Zoom & Pan:**
```
Ctrl/Cmd + Scroll    = Zoom in/out (25% - 400%)
Scroll               = Pan up/down
Shift + Scroll       = Pan left/right
Space + Drag         = Pan canvas
Middle-click + Drag  = Pan canvas
```

**Selection:**
```
Click                = Select node
Double-click         = Inline text edit (Text/Heading only)
Delete / Backspace   = Remove selected node
Ctrl/Cmd + C         = Copy node
Ctrl/Cmd + V         = Paste node
Ctrl/Cmd + Z         = Undo
Ctrl/Cmd + Shift + Z = Redo
```

**Visual Snapping:**
When dragging absolute-positioned elements:
- Pink snap lines appear aligning to sibling edges
- Threshold: 5px visual distance
- Alignments: left, center, right, top, middle, bottom

---

## Runtime System

### Rendering Flow

```
1. Request comes in for /store/[slug]/[page]
2. Load published document from database
3. Resolve route → page document
4. Load data profile (products, collections, etc.)
5. Compose RuntimeContext with all data
6. <Renderer tree={tree} /> traverses tree and renders React components
7. Client-side hydration for interactivity
```

### Runtime Context

All data available during rendering:

```typescript
interface RuntimeContext {
    // Store data
    store: {
        id: string;
        name: string;
        slug: string;
        currency: string;
    };
    
    // Settings
    settings: {
        deliveryModes?: ('DELIVERY' | 'PICKUP')[];
        checkoutFields?: Record<string, FieldConfig>;
    };
    
    // User
    user: {
        id: string;
        email: string;
        name?: string;
    } | null;
    
    // Shopping cart
    cart: {
        id: string;
        items: CartItem[];
        subtotal: number;
        total: number;
        currency: string;
    } | null;
    
    // Current route
    route: {
        pathname: string;
        params: Record<string, string>;
        searchParams: Record<string, string | string[]>;
    };
    
    // Client-side UI state
    uiState: {
        selectedVariantId?: string;
        cartSidebarOpen?: boolean;
        activeFilters?: Record<string, string[]>;
    };
    
    // Page-specific data (varies by route)
    product?: ProductContext;           // PDP pages
    collection?: CollectionContext;     // Collection pages
    orders?: OrdersContext;             // Account pages
    facets?: FacetsContext;             // Collection filters
    prefabs?: Record<string, StorefrontNode>; // Reusable components
}
```

### Component Registry

Components are registered with definitions that declare their capabilities:

```typescript
registerComponent(
    'ProductCard',           // type
    ProductCardComponent,    // React component
    {
        type: 'ProductCard',
        displayName: 'Product Card',
        category: 'commerce',
        icon: 'ShoppingBag',
        
        // Zod schema for props validation
        propsSchema: z.object({
            showPrice: z.boolean().default(true),
            layout: z.enum(['grid', 'list']).default('grid'),
        }),
        
        // UI controls for the inspector panel
        controls: {
            showPrice: { type: 'boolean', label: 'Show Price' },
            layout: { 
                type: 'select', 
                label: 'Layout',
                options: ['grid', 'list']
            },
        },
        
        // Where can this component be placed?
        constraints: {
            canHaveChildren: false,
            allowedChildren: undefined,  // undefined = any
            maxChildren: undefined,
        },
        
        // Default values when created
        defaults: {
            props: { showPrice: true, layout: 'grid' },
            styleTokens: { backgroundColor: 'colors.card' },
        },
    }
);
```

### Binding Resolution

**V1 (Legacy string paths):**
```typescript
bindings: { "text": "product.name" }
// Resolved: context.product.name
```

**V2 (AST expressions):**
```typescript
bindingMap: {
    "text": {
        kind: "transform",
        transformId: "uppercase",
        input: {
            kind: "path",
            root: "product",
            segments: ["name"]
        }
    }
}
// Resolved: toUpperCase(context.product.name)
```

**Binding expression kinds:**
- `path` - Navigate context object (e.g., `product.variants[0].price`)
- `literal` - Static value
- `conditional` - If/else logic
- `transform` - Apply formatting function
- `fallback` - Try primary, fall back to secondary

### Style Resolution

Styles are resolved in priority order:
1. `styleOverrides` - Inline styles (highest priority)
2. `styleTokens` - Theme token references (e.g., `colors.primary`)
3. Component defaults
4. Theme base tokens (lowest priority)

**Responsive breakpoints (mobile-first):**
```typescript
styleOverrides: {
    base: { padding: '16px' },      // Default
    sm: { padding: '20px' },        // >= 640px
    md: { padding: '24px' },        // >= 768px
    lg: { padding: '32px' },        // >= 1024px
    xl: { padding: '48px' },        // >= 1280px
    hover: { backgroundColor: '#eee' },
    focus: { outline: '2px solid blue' },
}
```

---

## Data Flow

### Saving a Document

```
User edits in Canvas
    ↓
Editor Store updates tree
    ↓
Auto-save debounced (3s) or manual save
    ↓
Server action: handleSave(tree, theme)
    ↓
Validation: validateDocument(tree)
    ↓
storefrontService.saveDraft(storeId, kind, key, tree)
    ↓
Prisma upsert: storefrontDocument table
```

### Publishing

```
User clicks "Publish"
    ↓
Server action: handlePublish(tree, theme)
    ↓
Save draft first
    ↓
Publish document (copy DRAFT → PUBLISHED)
    ↓
Publish theme (copy DRAFT → PUBLISHED)
    ↓
Revalidate Next.js paths
    ↓
Live storefront updated
```

### Loading in Runtime

```
Request to /store/[slug]/collection
    ↓
Load published GLOBAL_LAYOUT
    ↓
Load published COLLECTION page
    ↓
Resolve route → page document
    ↓
Load data profile for collection page
    ↓
Fetch products from database
    ↓
Compose RuntimeContext
    ↓
Render: <RendererWithLayout layout={layout} page={page} />
```

---

## Special Components

### Repeater

Renders children for each item in an array:

```typescript
{
    type: 'Repeater',
    props: { items: [] },
    bindingMap: {
        items: {
            kind: 'path',
            root: 'collection',
            segments: ['products']
        }
    },
    children: [
        {
            type: 'ProductCard',
            bindingMap: {
                product: { kind: 'path', root: 'item', segments: [] }
            }
        }
    ]
}
```

Creates a scoped context with `item` and `index` for each iteration.

### Conditional

Conditionally renders children:

```typescript
{
    type: 'Conditional',
    props: { show: true },
    bindingMap: {
        show: {
            kind: 'path',
            root: 'user',
            segments: ['id']
        }
    },
    children: [contentNode]
}
```

### Prefab

Instantiates a reusable component tree with overrides:

```typescript
{
    type: 'Prefab',
    props: { prefabKey: 'ProductCard' },
    prefabOverrides: {
        'title-node': { 
            bindingMap: {
                text: { kind: 'path', root: 'item', segments: ['name'] }
            }
        },
        'price-node': {
            styleTokens: { color: 'colors.sale' }
        }
    }
}
```

Prefabs enable reusable component patterns (e.g., different product card styles).

---

## Key Files

| File | Purpose |
|------|---------|
| `/shared/types/storefront-builder.ts` | All TypeScript definitions |
| `/modules/builder/editor-store.ts` | Editor state management (Zustand) |
| `/modules/builder/commands.ts` | Command bus with undo/redo |
| `/modules/storefront/runtime/renderer.tsx` | Tree rendering engine |
| `/modules/storefront/runtime/context.tsx` | Runtime context providers |
| `/modules/storefront/bindings.ts` | Binding resolution (V1 + V2) |
| `/modules/storefront/binding-ast.ts` | AST-based binding system |
| `/modules/storefront/registry/index.ts` | Component registration API |
| `/server/services/storefront.service.ts` | Document CRUD operations |
| `/shared/utils/tree.ts` | Tree manipulation utilities |

---

## Common Patterns

### Adding a Custom Component

```typescript
// 1. Create the component
function MyComponent({ title, count }: { title: string; count: number }) {
    return <div>{title}: {count}</div>;
}

// 2. Register it
registerComponent('MyComponent', MyComponent, {
    type: 'MyComponent',
    displayName: 'My Component',
    category: 'content',
    propsSchema: z.object({
        title: z.string().default('Title'),
        count: z.number().default(0),
    }),
    controls: {
        title: { type: 'text', label: 'Title' },
        count: { type: 'number', label: 'Count' },
    },
    constraints: { canHaveChildren: false },
    defaults: { props: { title: 'Title', count: 0 } },
});
```

### Creating a Binding

```typescript
// In editor - bind heading text to product name
const binding: BindingExpr = {
    kind: 'transform',
    transformId: 'uppercase',
    input: {
        kind: 'path',
        root: 'product',
        segments: ['name']
    }
};

// Apply via command
const cmd = {
    type: 'UPDATE_BINDINGS' as const,
    nodeId: 'heading_1',
    bindingMap: { text: binding }
};
```

### Validating Documents

```typescript
import { validateDocument } from '@/modules/storefront/validation';

const result = validateDocument(tree, 'PAGE');
if (!result.valid) {
    console.error('Validation errors:', result.errors);
}
```

---

Last updated: 2025-02-17
