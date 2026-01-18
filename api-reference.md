# E-Commerce Platform API Reference

**Version:** 1.0  
**Last Updated:** January 18, 2026  
**Base URL:** `https://your-domain.com/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin APIs](#admin-apis)
3. [Customer APIs](#customer-apis)
4. [Platform APIs](#platform-apis)
5. [Superadmin APIs](#superadmin-apis)
6. [Error Responses](#error-responses)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints (except public customer browsing) require authentication via:
- **Session Cookie** (for web applications)
- **API Key** (for external integrations)

### API Key Authentication

Include your API key in the request header:
```
Authorization: Bearer sk_live_your_api_key_here
```

---

## Admin APIs

Base path: `/api/admin/*`

**Authentication Required:** Store role (OWNER, MANAGER, or SUPPORT)

### Store Management

#### Create Store
```
POST /api/admin/stores
```

**Request Body:**
```json
{
  "name": "My Store",
  "slug": "my-store"
}
```

**Response:** `201 Created`
```json
{
  "id": "store_abc123",
  "accountId": "acc_xyz789",
  "name": "My Store",
  "slug": "my-store",
  "createdAt": "2026-01-18T10:00:00Z"
}
```

#### List Stores
```
GET /api/admin/stores
```

**Response:** `200 OK`
```json
{
  "stores": [
    {
      "id": "store_abc123",
      "name": "My Store",
      "slug": "my-store",
      "createdAt": "2026-01-18T10:00:00Z"
    }
  ]
}
```

#### Get Store
```
GET /api/admin/stores/{id}
```

**Response:** `200 OK`

#### Update Store
```
PATCH /api/admin/stores/{id}
```

**Request Body:**
```json
{
  "name": "Updated Store Name"
}
```

#### Delete Store
```
DELETE /api/admin/stores/{id}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

### Product Management

#### Create Product
```
POST /api/admin/products
```

**Request Body:**
```json
{
  "name": "Premium Leather Jacket",
  "description": "High-quality leather jacket",
  "categoryId": "cat_abc123",
  "isActive": true
}
```

**Response:** `201 Created`
```json
{
  "id": "prod_xyz789",
  "storeId": "store_123",
  "name": "Premium Leather Jacket",
  "description": "High-quality leather jacket",
  "categoryId": "cat_abc123",
  "isActive": true,
  "createdAt": "2026-01-18T10:00:00Z"
}
```

#### List Products
```
GET /api/admin/products?categoryId={categoryId}&isActive={true|false}&search={query}&skip={0}&take={50}
```

**Query Parameters:**
- `categoryId` (optional) - Filter by category
- `isActive` (optional) - Filter by active status
- `search` (optional) - Search by name
- `skip` (optional, default: 0) - Pagination offset
- `take` (optional, default: 50) - Items per page

**Response:** `200 OK`
```json
{
  "products": [...],
  "total": 45
}
```

#### Get Product
```
GET /api/admin/products/{id}
```

#### Update Product
```
PATCH /api/admin/products/{id}
```

#### Delete Product
```
DELETE /api/admin/products/{id}
```

---

### Category Management

#### Create Category
```
POST /api/admin/categories
```

**Request Body:**
```json
{
  "name": "Men's Clothing",
  "slug": "mens-clothing",
  "parentId": null
}
```

**Response:** `201 Created`

#### List Categories
```
GET /api/admin/categories?tree={true|false}
```

**Query Parameters:**
- `tree` (optional) - Return hierarchical tree structure

---

### Facet Management

#### Create Facet
```
POST /api/admin/facets
```

**Request Body:**
```json
{
  "name": "Color",
  "code": "color"
}
```

#### List Facets
```
GET /api/admin/facets
```

#### Add Facet Value
```
POST /api/admin/facets/{id}/values
```

**Request Body:**
```json
{
  "value": "Red"
}
```

---

### Variant Management

#### Create Variant
```
POST /api/admin/variants
```

**Request Body:**
```json
{
  "productId": "prod_xyz789",
  "sku": "JACKET-BLK-L",
  "price": 14999,
  "stock": 50
}
```

#### List Variants
```
GET /api/admin/variants?productId={productId}
```

#### Update Stock
```
PATCH /api/admin/variants/{id}/stock
```

**Request Body:**
```json
{
  "stock": 45
}
```

---

### Discount Management

#### Create Discount
```
POST /api/admin/discounts
```

**Request Body:**
```json
{
  "code": "SUMMER10",
  "name": "Summer Sale",
  "description": "10% off everything",
  "type": "PERCENTAGE",
  "value": 1000,
  "scope": "STORE_WIDE",
  "startsAt": "2026-06-01T00:00:00Z",
  "endsAt": "2026-08-31T23:59:59Z",
  "maxUsageCount": 1000,
  "maxUsagePerUser": 1,
  "minOrderValue": 100000,
  "isStackable": false
}
```

**Discount Types:**
- `PERCENTAGE` - Value in basis points (1000 = 10%)
- `FIXED_AMOUNT` - Value in smallest currency unit (20000 = ₹200)

**Discount Scopes:**
- `STORE_WIDE` - Applies to entire store
- `CATEGORY` - Applies to specific categories
- `PRODUCT` - Applies to specific products

#### List Discounts
```
GET /api/admin/discounts?isActive={true|false}&scope={scope}
```

#### Update Discount
```
PATCH /api/admin/discounts/{id}
```

#### Delete Discount
```
DELETE /api/admin/discounts/{id}
```

---

### Order Management

#### List Orders
```
GET /api/admin/orders?userId={userId}&status={status}&skip={0}&take={50}
```

**Order Statuses:**
- `PENDING` - Order created, awaiting payment
- `PAID` - Payment received
- `CANCELLED` - Order cancelled
- `REFUNDED` - Payment refunded

---

### Staff Management

#### Add Staff Member
```
POST /api/admin/staff
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "role": "MANAGER"
}
```

**Staff Roles:**
- `OWNER` - Full access
- `MANAGER` - Can manage products, orders, staff
- `SUPPORT` - Can view orders, limited access

#### List Staff
```
GET /api/admin/staff
```

#### Update Staff Role
```
PATCH /api/admin/staff/{id}
```

#### Remove Staff
```
DELETE /api/admin/staff/{id}
```

---

### API Key Management

#### Generate API Key
```
POST /api/admin/api-keys
```

**Request Body:**
```json
{
  "name": "Production API Key",
  "scopes": ["products:read", "products:write", "orders:read"]
}
```

**Available Scopes:**
- `*` - Full access
- `products:read` - Read products
- `products:write` - Create/update products
- `orders:read` - Read orders
- `orders:write` - Create orders
- `categories:read` - Read categories
- `categories:write` - Create/update categories
- `discounts:read` - Read discounts
- `discounts:write` - Create/update discounts

**Response:** `201 Created`
```json
{
  "id": "apikey_abc123",
  "keyId": "a1b2c3d4e5f6",
  "name": "Production API Key",
  "scopes": ["products:read", "products:write"],
  "fullKey": "sk_live_a1b2c3d4e5f6_7g8h9i0j1k2l",
  "createdAt": "2026-01-18T10:00:00Z"
}
```

> **Important:** The `fullKey` is only returned once. Store it securely.

#### List API Keys
```
GET /api/admin/api-keys
```

#### Revoke API Key
```
DELETE /api/admin/api-keys/{id}
```

---

### Payment Configuration

#### Create Payment Config
```
POST /api/admin/payment-configs
```

**Request Body (Stripe):**
```json
{
  "provider": "STRIPE",
  "apiKey": "sk_live_51A...",
  "webhookSecret": "whsec_...",
  "isLive": true
}
```

**Request Body (Razorpay):**
```json
{
  "provider": "RAZORPAY",
  "apiKey": "rzp_live_...",
  "apiSecret": "...",
  "isLive": true
}
```

**Supported Providers:**
- `STRIPE`
- `RAZORPAY`
- `MANUAL`

#### List Payment Configs
```
GET /api/admin/payment-configs
```

#### Update Payment Config
```
PATCH /api/admin/payment-configs/{id}
```

#### Delete Payment Config
```
DELETE /api/admin/payment-configs/{id}
```

---

## Customer APIs

Base path: `/api/customer/*`

**Authentication:** Optional for browsing, required for orders

### Product Browsing

#### Browse Products
```
GET /api/customer/products?categoryId={categoryId}&isActive=true&search={query}&skip={0}&take={50}
```

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "prod_xyz789",
      "name": "Premium Leather Jacket",
      "description": "High-quality leather jacket",
      "isActive": true,
      "variants": [
        {
          "id": "var_123",
          "sku": "JACKET-BLK-L",
          "price": 14999,
          "stock": 50
        }
      ]
    }
  ],
  "total": 45
}
```

#### View Product Details
```
GET /api/customer/products/{id}
```

---

### Category Browsing

#### Browse Categories
```
GET /api/customer/categories?tree=true
```

---

### Facet Filtering

#### View Facets
```
GET /api/customer/facets
```

**Response:** `200 OK`
```json
{
  "facets": [
    {
      "id": "facet_abc123",
      "name": "Color",
      "code": "color",
      "values": [
        { "id": "fv_123", "value": "Red" },
        { "id": "fv_124", "value": "Blue" }
      ]
    }
  ]
}
```

---

### Order Management

#### Create Order
```
POST /api/customer/orders
```

**Request Body:**
```json
{
  "userId": "user_abc123",
  "lines": [
    {
      "variantId": "var_xyz789",
      "quantity": 2
    }
  ],
  "currency": "INR",
  "couponCode": "SUMMER10"
}
```

**Response:** `201 Created`
```json
{
  "id": "order_abc123",
  "storeId": "store_123",
  "userId": "user_abc123",
  "subtotal": 44997,
  "discountAmount": 4500,
  "total": 40497,
  "currency": "INR",
  "status": "PENDING",
  "createdAt": "2026-01-18T10:00:00Z",
  "lines": [...],
  "discounts": [...]
}
```

#### View Own Orders
```
GET /api/customer/orders?userId={userId}&status={status}
```

---

### Payment Processing

#### Create Payment Intent
```
POST /api/customer/payments/intent
```

**Request Body:**
```json
{
  "orderId": "order_abc123",
  "provider": "STRIPE",
  "currency": "INR"
}
```

**Response (Stripe):** `200 OK`
```json
{
  "provider": "STRIPE",
  "paymentId": "pay_xyz789",
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

**Response (Razorpay):** `200 OK`
```json
{
  "provider": "RAZORPAY",
  "paymentId": "pay_xyz789",
  "razorpayOrderId": "order_xxx",
  "amount": 40497,
  "currency": "INR"
}
```

#### Verify Payment
```
POST /api/customer/payments/verify
```

**Request Body (Razorpay):**
```json
{
  "orderId": "order_abc123",
  "paymentId": "pay_xyz789",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

---

### Webhooks

#### Payment Webhook
```
POST /api/customer/webhooks/{provider}
```

Handles webhook events from payment providers (Stripe, Razorpay).

---

## Platform APIs

Base path: `/api/platform/*`

**Authentication Required:** Account ownership

### Subscription Management

#### View Current Subscription
```
GET /api/platform/subscriptions
```

**Response:** `200 OK`
```json
{
  "hasSubscription": true,
  "status": "ACTIVE",
  "plan": {
    "id": "plan_abc123",
    "name": "Pro Plan",
    "type": "PRO",
    "price": 299900,
    "maxStores": 5,
    "maxProducts": 10000
  },
  "currentPeriodStart": "2026-01-01T00:00:00Z",
  "currentPeriodEnd": "2026-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false
}
```

#### Upgrade Subscription
```
POST /api/platform/subscriptions
```

**Request Body:**
```json
{
  "planType": "PRO",
  "paymentProvider": "STRIPE"
}
```

**Plan Types:**
- `FREE` - Free tier
- `BASIC` - Basic plan
- `PRO` - Professional plan
- `ENTERPRISE` - Enterprise plan

**Response:** `200 OK`
```json
{
  "invoice": {...},
  "plan": {...},
  "amount": 299900,
  "currency": "INR"
}
```

#### Cancel Subscription
```
POST /api/platform/subscriptions/cancel
```

**Response:** `200 OK`
```json
{
  "id": "sub_abc123",
  "cancelAtPeriodEnd": true,
  "currentPeriodEnd": "2026-02-01T00:00:00Z"
}
```

---

### Plan Information

#### List Available Plans
```
GET /api/platform/plans
```

**Response:** `200 OK`
```json
{
  "plans": [
    {
      "id": "plan_free",
      "type": "FREE",
      "name": "Free Plan",
      "price": 0,
      "maxStores": 1,
      "maxProducts": 100,
      "maxOrdersPerMonth": 50
    },
    {
      "id": "plan_pro",
      "type": "PRO",
      "name": "Pro Plan",
      "price": 299900,
      "yearlyPrice": 2999000,
      "maxStores": 5,
      "maxProducts": 10000,
      "maxOrdersPerMonth": null
    }
  ]
}
```

---

### Account Management

#### Get Account Details
```
GET /api/platform/accounts
```

**Response:** `200 OK`
```json
{
  "id": "acc_abc123",
  "name": "My Business",
  "createdAt": "2026-01-01T00:00:00Z",
  "subscription": {...},
  "stores": [...]
}
```

---

### Billing History

#### List Invoices
```
GET /api/platform/invoices
```

**Response:** `200 OK`
```json
{
  "invoices": [
    {
      "id": "inv_abc123",
      "amount": 299900,
      "currency": "INR",
      "status": "COMPLETED",
      "paidAt": "2026-01-01T10:00:00Z",
      "periodStart": "2026-01-01T00:00:00Z",
      "periodEnd": "2026-02-01T00:00:00Z"
    }
  ]
}
```

---

## Superadmin APIs

Base path: `/api/superadmin/*`

**Authentication Required:** Superadmin role

> **Note:** These endpoints require superadmin authentication (to be implemented).

### User Management

#### List All Users
```
GET /api/superadmin/users?search={query}&skip={0}&take={50}
```

**Response:** `200 OK`
```json
{
  "users": [...],
  "total": 1250
}
```

#### Get User Details
```
GET /api/superadmin/users/{id}
```

#### Update User
```
PATCH /api/superadmin/users/{id}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### Delete User
```
DELETE /api/superadmin/users/{id}
```

---

### Store Management

#### List All Stores
```
GET /api/superadmin/stores?search={query}&skip={0}&take={50}
```

#### Create Store (for any account)
```
POST /api/superadmin/stores
```

**Request Body:**
```json
{
  "accountId": "acc_xyz789",
  "name": "New Store",
  "slug": "new-store"
}
```

#### Get Store Details
```
GET /api/superadmin/stores/{id}
```

#### Update Store
```
PATCH /api/superadmin/stores/{id}
```

#### Delete Store
```
DELETE /api/superadmin/stores/{id}
```

---

### Subscription Management

#### List All Subscriptions
```
GET /api/superadmin/subscriptions?status={status}&skip={0}&take={50}
```

**Subscription Statuses:**
- `ACTIVE` - Active subscription
- `PAST_DUE` - Payment failed
- `CANCELED` - Cancelled
- `TRIALING` - In trial period

#### Create Subscription
```
POST /api/superadmin/subscriptions
```

**Request Body:**
```json
{
  "accountId": "acc_xyz789",
  "planId": "plan_pro",
  "startDate": "2026-01-18T00:00:00Z"
}
```

#### Update Subscription
```
PATCH /api/superadmin/subscriptions/{accountId}
```

**Request Body (Change Plan):**
```json
{
  "planId": "plan_enterprise"
}
```

**Request Body (Update Status):**
```json
{
  "status": "CANCELED"
}
```

#### Cancel Subscription
```
DELETE /api/superadmin/subscriptions/{accountId}
```

---

### Plan Management

#### List All Plans
```
GET /api/superadmin/plans
```

**Response:** Includes inactive plans

#### Create Plan
```
POST /api/superadmin/plans
```

**Request Body:**
```json
{
  "name": "Enterprise Plan",
  "type": "ENTERPRISE",
  "price": 999900,
  "yearlyPrice": 9999000,
  "maxStores": null,
  "maxProducts": null,
  "maxOrdersPerMonth": null,
  "maxAPIRequestsPerMonth": null,
  "isActive": true
}
```

#### Update Plan
```
PATCH /api/superadmin/plans/{id}
```

#### Deactivate Plan
```
DELETE /api/superadmin/plans/{id}
```

---

### Analytics

#### Get Platform Metrics
```
GET /api/superadmin/analytics
```

**Response:** `200 OK`
```json
{
  "totalUsers": 1250,
  "totalStores": 450,
  "totalOrders": 15780,
  "totalRevenue": 125000000,
  "activeSubscriptions": 380,
  "subscriptionBreakdown": [
    {
      "planName": "Free Plan",
      "planType": "FREE",
      "count": 200
    },
    {
      "planName": "Pro Plan",
      "planType": "PRO",
      "count": 150
    }
  ]
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": {
    "field": "fieldName",
    "limit": 100,
    "current": 105
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Messages

**Authentication Errors:**
```json
{
  "error": "User authentication required"
}
```

**Permission Errors:**
```json
{
  "error": "Only store owners can delete stores"
}
```

**Validation Errors:**
```json
{
  "error": "Store name is required"
}
```

**Usage Limit Errors:**
```json
{
  "error": "Monthly order limit reached. Your Basic plan allows 100 orders per month.",
  "details": {
    "limit": 100,
    "current": 100,
    "resource": "orders"
  }
}
```

**Stock Errors:**
```json
{
  "error": "Insufficient stock for JACKET-BLK-L. Available: 5, Requested: 10"
}
```

---

## Rate Limiting

API requests are rate-limited based on your subscription plan:

| Plan | Requests per Month |
|------|-------------------|
| Free | 10,000 |
| Basic | 100,000 |
| Pro | 1,000,000 |
| Enterprise | Unlimited |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100000
X-RateLimit-Remaining: 99950
X-RateLimit-Reset: 1706745600
```

When rate limit is exceeded:
```
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded. Limit resets at 2026-02-01T00:00:00Z"
}
```

---

## Best Practices

### Security
1. **Never expose API keys** in client-side code
2. **Use HTTPS** for all API requests
3. **Validate webhook signatures** for payment webhooks
4. **Implement CSRF protection** for session-based auth

### Performance
1. **Use pagination** for list endpoints
2. **Cache frequently accessed data** (products, categories)
3. **Batch requests** when possible
4. **Use webhooks** instead of polling

### Error Handling
1. **Always check HTTP status codes**
2. **Parse error messages** for user-friendly display
3. **Implement retry logic** with exponential backoff
4. **Log errors** for debugging

### Data Integrity
1. **Never trust client-side calculations** (order totals, discounts)
2. **Validate all input** on the server
3. **Use idempotency keys** for payment operations
4. **Handle concurrent updates** appropriately

---

## Support

For API support, please contact:
- **Email:** api-support@your-domain.com
- **Documentation:** https://docs.your-domain.com
- **Status Page:** https://status.your-domain.com

---

**© 2026 Your Company. All rights reserved.**
