/**
 * Commerce components for product display, cart, and checkout
 */

'use client';

import React from 'react';
import NextLink from 'next/link';
import NextImage from 'next/image';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';
import type { ProductContext, VariantContext, CartItemContext } from '@/types/storefront-builder';
import { useRuntimeContext } from '../runtime/context';

// ==================== ProductCard ====================
interface ProductCardProps extends BaseComponentProps {
    product?: ProductContext;
    href?: string;
}

function ProductCard({ product, href, style, className, onClick, ...rest }: ProductCardProps) {
    const { context } = useRuntimeContext();
    const slug = context?.store?.slug;

    if (!product) {
        return <div style={{ padding: '1rem', ...style }}>[No product]</div>;
    }

    const defaultVariant = product.variants[0];
    const image = product.images[0] ?? defaultVariant?.images[0];

    const card = (
        <div
            style={{
                ...style,
            }}
            className={`group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden ${className || ''}`}
            onClick={onClick}
            {...rest}
        >
            <div className="relative aspect-square bg-muted overflow-hidden">
                {image && (
                    <NextImage
                        src={image.url}
                        alt={image.alt || product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                )}
            </div>
            <div className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{product.name}</h3>
                {defaultVariant && (
                    <div className="text-primary font-bold">
                        <PriceDisplay price={defaultVariant.price} currency={context.store.currency} />
                    </div>
                )}
            </div>
        </div>
    );

    // Resolve href
    let finalHref = href;
    if (!finalHref && slug) {
        finalHref = `/store/${slug}/products/${product.id}`;
    } else if (finalHref && slug && finalHref.startsWith('/') && !finalHref.startsWith('/store/')) {
        finalHref = `/store/${slug}${finalHref}`;
    }

    if (finalHref) {
        return <NextLink href={finalHref}>{card}</NextLink>;
    }

    return card;
}

// ==================== ProductGrid ====================
interface ProductGridProps extends BaseComponentProps {
    products?: ProductContext[];
    columns?: number;
    limit?: number;
    basePath?: string;
    /** Filter by product schema ID */
    productSchemaId?: string;
    /** Mode for selecting card prefab: 'perSchema' uses schema-specific cards, 'fixed' uses default */
    cardPrefabKeyMode?: 'perSchema' | 'fixed';
}

function ProductGrid({
    products = [],
    columns = 4,
    limit,
    basePath,
    productSchemaId,
    cardPrefabKeyMode = 'fixed',
    style,
    className,
    ...rest
}: ProductGridProps) {
    const { context } = useRuntimeContext();
    const slug = context?.store?.slug;

    // Default base path definition
    const effectiveBasePath = basePath || (slug ? `/store/${slug}/products` : '/products');

    // Filter products by schema if specified
    let filteredProducts = products;
    if (productSchemaId) {
        filteredProducts = products.filter((p) => p.productSchemaId === productSchemaId);
    }

    // Apply limit
    const displayProducts = limit ? filteredProducts.slice(0, limit) : filteredProducts;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} href={`${effectiveBasePath}/${product.id}`} />
            ))}
        </div>
    );
}


// ==================== PriceDisplay ====================
interface PriceDisplayProps extends BaseComponentProps {
    /** Price in cents (smallest currency unit) */
    price?: number;
    /** ISO currency code (USD, EUR, GBP, INR, etc.) */
    currency?: string;
    /** Optional original price in cents (for showing discounts) */
    originalPrice?: number;
    /** Optional locale for formatting */
    locale?: string;
}

function PriceDisplay({
    price = 0,
    currency,
    originalPrice,
    locale = 'en-US',
    style,
    className,
    ...rest
}: PriceDisplayProps) {
    const { context } = useRuntimeContext();
    // Default currency from store context if not provided
    const effectiveCurrency = currency || context?.store?.currency || 'USD';

    const formatPrice = (amountInCents: number): string => {
        // Convert cents to major currency unit
        const amount = amountInCents / 100;

        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: effectiveCurrency.toUpperCase(),
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch (error) {
            // Fallback to USD if currency code is invalid
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...style }} className={className} {...rest}>
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatPrice(price)}</span>
            {originalPrice && originalPrice > price && (
                <span style={{ textDecoration: 'line-through', color: 'var(--muted-foreground)' }}>
                    {formatPrice(originalPrice)}
                </span>
            )}
        </div>
    );
}

// ==================== VariantSelector ====================
interface VariantSelectorProps extends BaseComponentProps {
    variants?: VariantContext[];
    selected?: string;
    onChange?: (variantId: string) => void;
}

function VariantSelector({
    variants = [],
    selected,
    onChange,
    style,
    className,
    ...rest
}: VariantSelectorProps) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', ...style }} className={className} {...rest}>
            {variants.map((variant) => (
                <button
                    key={variant.id}
                    onClick={() => onChange?.(variant.id)}
                    style={{
                        padding: '0.5rem 1rem',
                        border: selected === variant.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: selected === variant.id ? 'var(--primary)' : 'transparent',
                        color: selected === variant.id ? 'var(--primary-foreground)' : 'var(--foreground)',
                        cursor: 'pointer',
                        opacity: variant.stock > 0 ? 1 : 0.5,
                    }}
                    disabled={variant.stock === 0}
                >
                    {variant.sku}
                </button>
            ))}
        </div>
    );
}

// ==================== AddToCartButton ====================
interface AddToCartButtonProps extends BaseComponentProps {
    text?: string;
    disabled?: boolean;
}

function AddToCartButton({
    text = 'Add to Cart',
    disabled = false,
    style,
    className,
    onClick,
    ...rest
}: AddToCartButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                ...style,
            }}
            className={className}
            {...rest}
        >
            {text}
        </button>
    );
}

// ==================== BuyNowButton ====================
interface BuyNowButtonProps extends BaseComponentProps {
    text?: string;
    disabled?: boolean;
}

function BuyNowButton({
    text = 'Buy Now',
    disabled = false,
    style,
    className,
    onClick,
    ...rest
}: BuyNowButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius)',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                ...style,
            }}
            className={className}
            {...rest}
        >
            {text}
        </button>
    );
}

// ==================== CartSidebar ====================
interface CartSidebarProps extends BaseComponentProps {
    isOpen?: boolean;
    items?: CartItemContext[];
    subtotal?: number;
    total?: number;
    currency?: string;
    onClose?: () => void;
}

function CartSidebar({
    isOpen = false,
    items = [],
    subtotal = 0,
    total = 0,
    currency,
    onClose,
    style,
    className,
    ...rest
}: CartSidebarProps) {
    const { context } = useRuntimeContext();
    const slug = context?.store?.slug;
    // Use store currency if not provided
    const effectiveCurrency = currency || context?.store?.currency || 'USD';
    const checkoutLink = slug ? `/store/${slug}/checkout` : '/checkout';

    if (!isOpen) return null;

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: effectiveCurrency });

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: '400px',
                maxWidth: '100%',
                backgroundColor: 'var(--background)',
                borderLeft: '1px solid var(--border)',
                boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                ...style,
            }}
            className={className}
            {...rest}
        >
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Your Cart</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                {items.length === 0 ? (
                    <p style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>Your cart is empty</p>
                ) : (
                    items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
                                {item.product?.images?.[0] && (
                                    <NextImage src={item.product.images[0].url} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                                )}
                            </div>
                            <div>
                                <p style={{ fontWeight: 500 }}>{item.product.name}</p>
                                <p style={{ color: 'var(--muted-foreground)' }}>Qty: {item.quantity}</p>
                                <p style={{ fontWeight: 600 }}>{formatter.format(item.lineTotal / 100)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Subtotal:</span>
                    <span>{formatter.format(subtotal / 100)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.125rem' }}>
                    <span>Total:</span>
                    <span>{formatter.format(total / 100)}</span>
                </div>
                <NextLink href={checkoutLink} style={{ display: 'block', marginTop: '1rem' }}>
                    <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 500, cursor: 'pointer' }}>
                        Checkout
                    </button>
                </NextLink>
            </div>
        </div>
    );
}

// Register all commerce components
export function registerCommerceComponents() {
    registerComponent('ProductCard', ProductCard as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'ProductCard',
        displayName: 'Product Card',
        category: 'commerce',
        icon: 'Package',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: { base: { width: '100%', maxWidth: '300px' } },
        },
    });

    registerComponent('ProductGrid', ProductGrid as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'ProductGrid',
        displayName: 'Product Grid',
        category: 'commerce',
        icon: 'Grid3X3',
        propsSchema: {},
        controls: {
            columns: { type: 'number', label: 'Columns', defaultValue: 4, min: 1, max: 12 },
            limit: { type: 'number', label: 'Max Products', defaultValue: 8, min: 1, max: 100 },
            productSchemaId: { type: 'text', label: 'Product Schema ID' },
            cardPrefabKeyMode: {
                type: 'select',
                label: 'Card Layout Mode',
                options: [
                    { label: 'Fixed (Default Card)', value: 'fixed' },
                    { label: 'Per Schema (Adaptive)', value: 'perSchema' },
                ],
                defaultValue: 'fixed',
            },
            basePath: { type: 'text', label: 'Base Product Link Path' },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: { columns: 4, limit: 8, cardPrefabKeyMode: 'fixed' },
            styles: { base: { margin: '2rem 0' } },
        },
    });

    registerComponent('PriceDisplay', PriceDisplay as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'PriceDisplay',
        displayName: 'Price Display',
        category: 'commerce',
        icon: 'CreditCard',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { price: 99.99, originalPrice: 129.99 },
            styles: {},
        },
    });

    registerComponent('VariantSelector', VariantSelector as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'VariantSelector',
        displayName: 'Variant Selector',
        category: 'commerce',
        icon: 'Star',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('AddToCartButton', AddToCartButton as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'AddToCartButton',
        displayName: 'Add to Cart',
        category: 'commerce',
        icon: 'ShoppingCart',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { text: 'Add to Cart' },
            styles: { base: { width: '100%' } },
        },
    });

    registerComponent('BuyNowButton', BuyNowButton as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'BuyNowButton',
        displayName: 'Buy Now',
        category: 'commerce',
        icon: 'CreditCard',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { text: 'Buy Now' },
            styles: { base: { width: '100%' } },
        },
    });

    registerComponent('CartSidebar', CartSidebar as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CartSidebar',
        displayName: 'Cart Sidebar',
        category: 'commerce',
        icon: 'ShoppingCart',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { isOpen: false },
            styles: {},
        },
    });
}
