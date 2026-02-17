# API Reference

## Authentication
All API routes require authentication via session cookies. Provide the session cookie with your requests.

## Products

### List Products
`GET /api/stores/[storeId]/products`

**Response:**
Returns a list of products for the specified store.

### Create Product
`POST /api/stores/[storeId]/products`

**Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "categoryId": "string (optional)",
  "productSchemaId": "string (optional)",
  "isActive": "boolean",
  "price": "number (optional, creates default variant)",
  "stock": "number (optional, creates default variant)",
  "sku": "string (optional, creates default variant)",
  "customData": "object (optional)"
}
```

### Get Product
`GET /api/stores/[storeId]/products/[productId]`

**Response:**
Returns a single product object.

### Update Product
`PATCH /api/stores/[storeId]/products/[productId]`

**Body:**
```json
{
  "name": "string",
  "description": "string",
  "categoryId": "string",
  "isActive": "boolean",
  "productSchemaId": "string",
  "customData": "object"
}
```

### Delete Product
`DELETE /api/stores/[storeId]/products/[productId]`

## Variants

### List Variants
`GET /api/stores/[storeId]/products/[productId]/variants`

**Response:**
Returns a list of variants for a product.

### Create Variant
`POST /api/stores/[storeId]/products/[productId]/variants`

**Body:**
```json
{
  "sku": "string (required)",
  "price": "number (required, in standard units e.g. 10.99)",
  "stock": "number",
  "isActive": "boolean",
  "customData": "object"
}
```

Note: Price is converted to minor units (multiplied by 100) on the server.

### Update Variant
`PATCH /api/stores/[storeId]/products/[productId]/variants/[variantId]`

**Body:**
```json
{
  "sku": "string",
  "price": "number",
  "stock": "number",
  "isActive": "boolean",
  "customData": "object"
}
```

### Delete Variant
`DELETE /api/stores/[storeId]/products/[productId]/variants/[variantId]`

## Product Schemas

### List Active Schemas
`GET /api/stores/[storeId]/product-schemas`

**Response:**
Returns a list of active product schemas.

### Get Schema
`GET /api/stores/[storeId]/product-schemas/[schemaId]`
