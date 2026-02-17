## Variants-only Images + Auto Migration (required)

Decision: product images are removed. Images live ONLY on variants. When a variant is selected, that variant’s image is shown.

### Admin UI: Product create/edit
File: `app/admin/stores/[storeId]/(dashboard)/products/components/product-form.tsx`
- Remove the entire “Product Images” (`imageUrls`) section for both create + edit.
- On create, add CTA: `Create product & create first variant` that:
  - creates product
  - redirects to `/admin/stores/${storeId}/products/${productId}/variants/new` (not variants list)
- Do not send `images` in product create/update payload anymore.

### Admin API/DAL: remove product images
Files:
- `app/api/admin/stores/[storeId]/products/route.ts`
- `app/api/admin/stores/[storeId]/products/[productId]/route.ts`
- `services/product.service.ts` (if needed for validation/back-compat)
- `dal/product.dal.ts`
- Stop accepting/persisting product-level `images` entirely (UI won’t send it).
- Keep reading existing product images for migration only (see migration).

### Admin UI: Variant images (new source of truth)
File: `app/admin/stores/[storeId]/(dashboard)/products/[productId]/variants/components/variant-form.tsx`
- Add “Variant Images” section (same URL list UI previously in product-form).
- Include `images: string[]` in variant POST/PATCH payload.

### Admin API/DAL: add variant images create/update
Files:
- `app/api/admin/stores/[storeId]/products/[productId]/variants/route.ts`
- `app/api/admin/stores/[storeId]/products/[productId]/variants/[variantId]/route.ts`
- `services/variant.service.ts`
- `dal/variant.dal.ts`
- Accept `images: string[]` in POST/PATCH:
  - POST: create variant + create related `images` rows (positioned)
  - PATCH: replace images (`deleteMany` then `create`) when `images` provided

### Storefront: when variant selected, show that image
Files:
- `lib/storefront/runtime/context.tsx` (already computes `selectedVariant`)
- `lib/storefront/registry/commerce.tsx`
Rules:
- `VariantSelector`: if `onChange` not provided, default to `setUIState('selectedVariantId', variantId)` so selection updates runtime.
- Card/PDP image rendering and prefab bindings must prefer `selectedVariant.images[0].url`.

### One-time Migration: copy existing product images into the first variant
Requirement: existing products may have product-level images but empty variant images. Migrate so storefront doesn’t lose images.

Add an admin migration endpoint (store-scoped):
- New route (example): `app/api/admin/stores/[storeId]/migrations/product-images-to-variant-images/route.ts`
- Method: `POST`
- Auth: OWNER (or MANAGER if you want)
- Behavior (idempotent):
  - For each product in store with `product.images.length > 0`:
    - Find first variant by `createdAt asc` (default variant)
    - If variant has 0 images, create variant images from product images (same URL order, position preserved, alt from product name)
  - Return counts: `{ productsScanned, variantsUpdated, imagesCreated }`
- Optional UI: add button in Admin Products page or Store settings “Run image migration”.

Post-migration:
- Storefront should rely on variant images only.
- Product image fields remain removed.