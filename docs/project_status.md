# Project Status: Flow and Current Problems

## Current Flow

1.  **Store Setup**: User creates a store.
2.  **Schema Definition (Optional)**:
    *   User defines `ProductSchema` (e.g., "T-Shirt", "Laptop") with dynamic fields (Size, Color, CPU).
3.  **Product Creation**:
    *   User creates a `Product`.
    *   Selects a `ProductSchema` (Product Type).
    *   Fills in base details (Name, Description).
    *   Adds Image URLs (stored in `customData.images`).
4.  **Variant Management**:
    *   User manages `Variants` for the product.
    *   Variants inherit the schema structure.
    *   User fills in dynamic values (e.g., "Red", "XL") into `customData` for each variant.
    *   Price and Stock are managed at the variant level.
5.  **Frontend Display**:
    *   Products and Variants are displayed with their dynamic attributes.

---

## Senior Engineer Code Review Findings

### 🚨 CRITICAL: Security Issues

1. **Credentials Provider allows passwordless login** (`lib/auth.ts` lines 29-50)
   - The credentials provider allows login as ANY existing user by just providing their email
   - This MUST be disabled in production or gated by `NODE_ENV !== 'production'`

2. **`allowDangerousEmailAccountLinking` is enabled** for Google OAuth
   - While useful for development, this is a security risk in production
   - Can allow account takeover via email address

### 🔐 Authorization Issues

3. **Missing storeId verification in variant operations**
   - The DAL functions (`variant.dal.ts`) don't verify the variant belongs to the store being accessed
   - A user with access to Store A could potentially modify variants in Store B by guessing variant IDs

4. **`getVariant` service function doesn't use storeId**
   - `variant.service.ts` line 72-74 accepts storeId but ignores it

### ✅ Validation Issues

5. **customData is NOT validated against ProductSchema**
   - There's a TODO comment (`variant.service.ts` line 123) but validation is not implemented
   - Malformed or malicious data could be stored

6. **No input sanitization for product/variant names**
   - XSS payloads could be stored and executed on the frontend

### 🛠️ Architectural Issues

7. **No rate limiting on API endpoints**
   - APIs are vulnerable to abuse, brute-force attacks, and DoS

8. **Generic error responses**
   - Provide no debugging info
   - Consider structured error responses with error codes

9. **Images stored in customData.images as URLs**
   - No dedicated Image model relationship is used for products
   - Though Image model exists in schema

### 🐛 Functional Issues

10. **Bulk operations not implemented**
    - No way to import/export products in bulk
    - Managing large inventories would be tedious

11. **Category system is de-emphasized**
    - Present in backend but removed from product form UI
    - Relationship between categories and schemas needs clarity

---

## Notion Links

- [API Reference](https://www.notion.so/API-Reference-Products-Variants-Schemas-2f476ead478981c2b704d94257422d35)
- [Code Review Findings](https://www.notion.so/Code-Review-Findings-Current-Problems-2f476ead47898142b92bc79da77c4895)
