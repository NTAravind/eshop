# Storefront Builder: Prefabs, Templates, and Pages

This document summarizes how Prefabs, Templates, and Pages work within the Storefront Builder from a programmer's perspective. All three are based on the common `StorefrontNode` structure but serve different roles in the system.

## Core Concept: StorefrontNode

The building block for everything is the `StorefrontNode`. It describes a UI element, its properties, bindings to data, actions, and styles.

```typescript
// Simplified definition
interface StorefrontNode {
    id: string;
    type: string; // e.g., 'Container', 'Text', 'Prefab', 'Repeater'
    props: Record<string, any>;
    children?: StorefrontNode[];
    bindingMap?: Record<string, Binding>; // Connects props to data (e.g., product.name)
    actionMap?: Record<string, ActionPipeline>; // Handles events (e.g., onClick)
    styleOverrides?: ResponsiveStyleOverrides;
    // ... other fields
}
```

---

## 1. Prefabs

**Prefabs** are reusable component definitions stored in the database. They act as "blueprints" that can be instantiated multiple times across different pages.

### Definition
Prefabs are defined as `StorefrontNode` trees. They typically populate the `bindingMap` to be data-driven (e.g., expecting a `product` in the context).

**Example: Product Card Prefab (`modules/storefront/defaults/prefabs/product-card.ts`)**
```typescript
export const productCardPrefab: StorefrontNode = {
    id: 'ProductCard_default',
    type: 'Container',
    // ...
    children: [
        {
            id: 'product_card_name',
            type: 'Heading',
            bindingMap: {
                text: migrateStringBinding('product.name'), // dynamic data binding
            },
        },
        {
            id: 'product_card_price',
            type: 'PriceDisplay',
            bindingMap: {
                price: migrateStringBinding('product.defaultVariant.price'),
            },
        },
         {
            id: 'product_card_button',
            type: 'AddToCartButton',
            actionMap: {
                onClick: migrateActionRef({
                    actionId: 'ADD_TO_CART',
                    payloadBindings: {
                         variantId: 'product.defaultVariant.id',
                    },
                }),
            },
        },
    ],
};
```

### Usage
In a page or template, you use a node of `type: 'Prefab'` and specify the `prefabKey`. You can also provide `overrides` to customize specific parts of the prefab instance.

**Example usage in a Page:**
```typescript
{
    id: 'my_product_card_instance',
    type: 'Prefab',
    props: {
        prefabKey: 'ProductCard', // ID of the prefab to render
        overrides: {
            'product_card_button': { // ID within the prefab to override
                props: {
                    text: 'Add to Bag' // Override the button text
                },
                 styleOverrides: {
                    base: { backgroundColor: 'black' }
                }
            }
        }
    }
}
```

### Runtime Rendering
The `RenderPrefab` component (in `renderer.tsx`):
1. Looks up the prefab tree from `context.prefabs` using `prefabKey`.
2. Applies `overrides` to the tree (merging props, styles, etc.).
3. Renders the resulting tree.

---

## 2. Templates

**Templates** are standard page structures defined in code (and stored in DB) that provide a starting point or a rigid structure for specific page types (like PDPs). They often use specific context variables (like `selectedVariant`) that are available on those page types.

### Definition
Templates are also `StorefrontNode` trees. They are often indistinguishable from Pages in structure but represent a "pattern" rather than a specific URL content.

**Example: PDP Template (`modules/storefront/defaults/pdp-template.ts`)**
```typescript
export const defaultPdpTemplate: StorefrontNode = {
    id: 'template_pdp',
    type: 'Container',
    children: [
        {
             id: 'pdp_image',
             type: 'Image',
             bindingMap: {
                 src: migrateStringBinding('selectedVariant.images[0].url'),
             },
        },
        // ... details, variant selector, etc.
    ]
};
```

---

## 3. Pages

**Pages** are the actual content served at a specific route (e.g., Home, Cart, generic content pages). They can contain static content, dynamic sections, and Prefab instances.

### Definition
Pages are `StorefrontNode` trees stored in the database with `kind: 'PAGE'`.

**Example: Home Page (`modules/storefront/defaults/home-page.ts`)**
```typescript
export const defaultHomePage: StorefrontNode = {
    id: 'page_home',
    type: 'Container',
    children: [
        {
            id: 'home_hero',
            type: 'Section',
            children: [
                { type: 'Heading', props: { text: 'Welcome' } }
            ]
        },
        {
            id: 'featured_products',
            type: 'ProductGrid',
            bindingMap: {
                products: migrateStringBinding('collection.products')
            }
        }
    ]
};
```

### Rendering & Data Flow
1. **Server (`page.tsx`)**:
   - Fetches the Page specific data (e.g., `store`, `products`).
   - Fetches the **Page Document**, **Layout Document**, and **All Published Prefabs** from the DB.
   - Passes everything to the client component.

   ```typescript
   // app/(storefront)/store/[slug]/page.tsx
   const [pageDoc, prefabs] = await Promise.all([
       getPublishedDocument(..., 'HOME'),
       getPublishedPrefabs(store.id),
   ]);
   
   return <StorefrontPage page={pageDoc.tree} pageData={{ prefabs }} ... />;
   ```

2. **Client (`StorefrontPage.tsx`)**:
   - Initializes `RuntimeContextProvider` with `prefabs` and other data.
   - parameters are passed to `RendererWithLayout`.

3. **Renderer (`renderer.tsx`)**:
   - `RendererWithLayout` renders the Layout.
   - It replaces the layout's `Slot` node with the Page content.
   - It recursively renders components.
   - When it encounters a `Prefab` node, it grabs the definition from the context (populated from DB) and renders it.

## Summary Table

| Concept | Purpose | Defined As | Storage (DB) | Runtime Resolving |
| :--- | :--- | :--- | :--- | :--- |
| **Prefab** | Reusable component "blueprint" | `StorefrontNode` tree | `StorefrontDocument` (`kind: PREFAB`) | Loaded into `context.prefabs`, looked up by `prefabKey`. |
| **Template** | Structural pattern for pages (e.g. PDP) | `StorefrontNode` tree | `StorefrontDocument` (`kind: TEMPLATE`) | Used as the initial structure when creating a page, or rendered directly. |
| **Page** | Specific route content | `StorefrontNode` tree | `StorefrontDocument` (`kind: PAGE`) | Fetched by route handler, rendered into Layout's `Slot`. |
