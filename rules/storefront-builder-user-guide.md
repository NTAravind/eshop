# Storefront Builder — User Guide

This guide is for non-technical store owners using the storefront builder. It explains what the builder is, how to edit pages, and how to publish changes safely.

## What the builder is
- A visual editor that lets you compose your storefront with predefined, editable shadcn UI blocks.
- Content is stored as drafts until you publish; published versions power the live `/store/[slug]/...` routes.
- Pages are assembled from reusable pieces: layouts (wrappers), pages/templates (content), and prefabs (reusable blocks).

## Key concepts
- **Layouts**: Wrappers with navigation/footer and a `Slot`. Pages and templates render inside the Slot. You can stack multiple layouts.
- **Pages**: Concrete screens like Home, Collection, Cart, Checkout, Orders, Profile, Login.
- **Templates**: Page designs tied to a product type (e.g., PDP per product schema). The correct template is chosen per product type.
- **Prefabs**: Reusable blocks you can drop into pages (like symbols).
- **Theme**: Colors, radii, typography tokens edited via the theme editor (tweakcn-style) with draft/publish.

## What you can edit
- Add, move, duplicate, or delete blocks from the left palette (components) and layers tree.
- Configure blocks in the right inspector:
  - **Props**: Text labels, toggles, counts, etc.
  - **Styles**: Spacing, layout, borders, colors (from tokens), typography.
  - **Bindings**: Choose data to show (e.g., product name, custom schema fields, cart totals).
  - **Actions**: What happens on click/submit (add to cart, buy now, open cart, navigate).
- Theme: Adjust brand tokens in the theme editor, preview live, then publish.

## Schema-aware product views
- Product pages and cards can show custom fields from your product type schema. In the inspector, choose the field key (e.g., `material`, `size_guide`) to display it.
- Variant selectors are driven by the variant schema linked to the product type.

## Common tasks
1) **Update Home**: Open the Home page, add hero copy, feature grid, and link to collections.
2) **Edit PDP**: Open the PDP template for the product type, rearrange gallery, title, price, variant selector, schema fields, similar products.
3) **Cart sidebar**: Ensure a cart sidebar exists in the global layout and that cart buttons trigger `Open Cart` action.
4) **Checkout**: Ensure delivery mode selector and place-order button are present on the Checkout page.
5) **Profile/Orders/Login**: Customize copy and layout on those pages.

## Actions (what buttons do)
- **Add to cart**: Adds the selected variant and can open the cart sidebar.
- **Buy now**: Adds then routes to checkout.
- **Select variant**: Changes the chosen variant for price/availability.
- **Open cart sidebar**: Toggles the cart sheet.
- **Navigate**: Moves to another page (PDP, collection, etc.).

## Editing flow
1) Open the builder from the store admin dashboard.
2) Pick a document (layout, page, template, prefab) to edit.
3) Use palette/layers to place components. Configure props/styles/bindings/actions in the inspector.
4) Preview: toggle preview/device mode to see it without editor chrome.
5) Save draft often; publish when ready. Drafts do not affect live storefront until published.

## Publishing
- **Draft**: Saved but not live.
- **Publish**: Copies draft to published for that doc or theme. Live pages use the latest published version.

## Safety tips
- Keep one Slot in each layout; removing it will break page rendering.
- For product cards/templates, always set a primary image and a price binding.
- Variant selectors should point to the product type’s variant schema fields.
- Theme publish affects the whole storefront; review in preview first.

## Where things show up
- Live storefront: `/store/[slug]/...` (Home, Collection, PDP, Cart, Checkout, Orders, Profile, Login).
- Builder: admin area under your store at `/admin/stores/[storeId]/storefront/builder`.
