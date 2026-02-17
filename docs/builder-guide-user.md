# Storefront Builder Guide (Normal User Terms)

This document explains the builder in plain language for non‑technical users.

## What It Does
The builder is a drag‑and‑drop editor for your storefront. You can add sections, product grids, buttons, filters, and more without coding. When you publish, your storefront updates.

## System Pieces (In Plain English)
- **Layouts** are the site frame (header, footer). Every page sits inside the layout.
- **Pages** are the screens shoppers see (Home, Collection, Cart, Checkout).
- **Templates** are page blueprints for dynamic pages (like product pages).
- **Prefabs** are reusable blocks (like Product Cards). Change once, update everywhere.

## How You Use It
1. **Open the Builder** for a page (Home, Collection, Cart, etc.).
2. **Drag components** from the left panel onto the page.
3. **Select components** to edit their settings in the right panel.
4. **Reorder or nest** components by dragging in the layer tree.
5. **Preview** and **Publish** when ready.

## Key Building Blocks
- **Sections/Rows/Columns**: Layout structure.
- **Text/Heading/Image**: Content.
- **Product Grid**: Shows products (uses the Product Card style).
- **Filters**: Lets shoppers narrow products by attributes.
- **Navbar/Footer**: Site‑wide navigation.
- **Cart Sidebar**: Slide‑out cart with items and checkout.

## Component List (Plain English)
- Layout: Container, Section, Row, Column, Grid, Flex, Spacer, Divider, Header, Footer, Slot
- Content: Text, Heading, Image, Link, Button, Badge, Icon
- Navigation: Navbar, NavItem, NavMenu, Breadcrumb, CollectionFilters, CollectionSort, NavFilterMenu
- Commerce: ProductCard, ProductGrid, PriceDisplay, VariantSelector, AddToCartButton, BuyNowButton, CartItemCard, CartSidebar
- Forms/Account/Checkout/Orders: OAuthButtons, LoginForm, DeliveryModeSelector, CheckoutForm, OrderSummary, PaymentMethods, PlaceOrderButton, OrderList, ProfileCard, UserProfileForm
- Utility: PrefabInstance

## Prefabs (Reusable Cards)
Some parts are reusable templates, like **Product Card**. If you update a prefab, it updates everywhere it’s used.

## Filters
- **Collection Filters**: Sidebar checkboxes for product attributes.
- **Nav Filter Menu**: A dropdown button in the navbar with clickable filter links.

## Publishing
Publishing saves your changes for visitors. Drafts are only visible inside the builder.

## Quick Tips
- Use **Product Grid** for all collection views.
- Place the **Nav Filter Menu** next to the Shop link in the navbar.
- Keep the layout simple and consistent; reuse prefabs where possible.
