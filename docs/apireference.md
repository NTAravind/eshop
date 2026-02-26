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

## Storefront Actions

These actions are available to the storefront builder and can be triggered by UI components.

 **Response Format:**
All actions return a Promise that resolves to an object with the following structure:
```json
{
  "success": "boolean",
  "data": "any (optional, depends on action)",
  "error": "string (optional, if success is false)"
}
```

### ADD_TO_CART
Add a product variant to the shopping cart.

**Payload:**
```json
{
  "variantId": "string (optional)",
  "quantity": "number (default: 1)",
  "openCart": "boolean (default: true)"
}
```

**Returns:** Updated cart object.

### REMOVE_FROM_CART
Remove an item from the shopping cart.

**Payload:**
```json
{
  "variantId": "string (required)"
}
```

**Returns:** Updated cart object.

### UPDATE_QUANTITY
Update the quantity of a cart item.

**Payload:**
```json
{
  "variantId": "string (required)",
  "quantity": "number (min: 0)"
}
```

**Returns:** Updated cart object.

### BUY_NOW
Add item and go directly to checkout.

**Payload:**
```json
{
  "variantId": "string (optional)",
  "quantity": "number (default: 1)"
}
```

**Returns:**
```json
{
  "redirect": "/checkout",
  ...cartData
}
```

### SELECT_VARIANT
Select a product variant.

**Payload:**
```json
{
  "variantId": "string (required)"
}
```

### APPLY_DISCOUNT
Apply a discount code to the cart.

**Payload:**
```json
{
  "code": "string (optional)"
}
```

**Returns:**
```json
{
  "applied": "boolean",
  "code": "string"
}
```

### SET_DELIVERY_MODE
Toggle between delivery and pickup.

**Payload:**
```json
{
  "mode": "'DELIVERY' | 'PICKUP'"
}
```

### OPEN_CART_SIDEBAR
Toggle the cart sidebar visibility.

**Payload:**
```json
{
  "open": "boolean (default: true)"
}
```

### GO_TO_CHECKOUT
Navigate the user to the checkout page.

**Payload:**
```json
{
  "storeSlug": "string (optional)"
}
```

### PLACE_ORDER
Submit the current checkout and place the order.

**Payload:**
```json
{
  "checkoutData": "object (optional)"
}
```

**Returns:**
```json
{
  "orderId": "string"
}
```

### NAVIGATE
Navigate to a different page.

**Payload:**
```json
{
  "to": "string (required)",
  "params": "object (string key-values)",
  "replace": "boolean (default: false)"
}
```

### UPDATE_UI_STATE
Update client-side UI state.

**Payload:**
```json
{
  "key": "string (required)",
  "value": "any"
}
```

### SUBMIT_FORM
Submit a form (checkout, login, etc.).

**Payload:**
```json
{
  "formType": "'checkout' | 'login' | 'signup' | 'profile' | 'contact'",
  "data": "object"
}
```

**Returns:**
```json
{
  "formType": "string",
  "submitted": "boolean"
}
```

