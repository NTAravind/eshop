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
import { Renderer } from '../runtime/renderer';
import { productCardPrefab } from '../defaults/prefabs/product-card';
import { cartItemCardPrefab } from '../defaults/prefabs/cart-item-card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import { Trash2 } from 'lucide-react';

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
    const imageObj = product.images[0] ?? defaultVariant?.images[0];
    const imageUrl = imageObj?.url ?? product.image;
    const imageAlt = imageObj?.alt ?? product.name;

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
                {imageUrl && (
                    <NextImage
                        src={imageUrl}
                        alt={imageAlt || product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                )}
            </div>
            <div className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{product.name}</h3>
                {defaultVariant && (
                    <div className="text-primary font-bold">
                        <PriceDisplay price={defaultVariant.price} currency={context?.store?.currency} />
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
    /* eslint-disable @typescript-eslint/no-unused-vars */
    columns: _columns = 4,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    cardPrefabKeyMode: _cardPrefabKeyMode = 'fixed',
    limit,
    basePath,
    productSchemaId,
    style,
    className,
    ...rest
}: ProductGridProps) {
    const { context } = useRuntimeContext();
    const slug = context?.store?.slug;

    // Default base path definition
    const effectiveBasePath = basePath || (slug ? `/store/${slug}/products` : '/products');

    // Use passed products or fallback to collection context
    // This ensures grids work in builder preview and on collection pages without explicit binding
    const sourceProducts = (products && products.length > 0) ? products : (context?.collection?.products || []);

    // Filter products by schema if specified
    let filteredProducts = sourceProducts;
    if (productSchemaId) {
        filteredProducts = sourceProducts.filter((p) => p.productSchemaId === productSchemaId);
    }

    // Apply limit
    const displayProducts = limit ? filteredProducts.slice(0, limit) : filteredProducts;

    const prefabs = context?.prefabs || {};
    const defaultCardKey = 'ProductCard';
    const defaultCardPrefab = prefabs[defaultCardKey] || productCardPrefab;

    const resolveCardPrefabKey = (product: ProductContext) => {
        if (_cardPrefabKeyMode === 'perSchema' && product.productSchemaId) {
            const schemaKey = `ProductCard:${product.productSchemaId}`;
            if (prefabs[schemaKey]) {
                return schemaKey;
            }
        }
        return defaultCardKey;
    };

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
            {displayProducts.map((product, index) => {
                const prefabKey = resolveCardPrefabKey(product);
                const prefabTree = prefabs[prefabKey] || defaultCardPrefab;

                if (prefabTree) {
                    const defaultVariant = product.variants?.[0] || (product as { defaultVariant?: VariantContext }).defaultVariant;
                    const scopedProduct = {
                        ...product,
                        defaultVariant,
                        href: `${effectiveBasePath}/${product.id}`,
                    };

                    return (
                        <div key={product.id} style={{ display: 'contents' }}>
                            <Renderer tree={prefabTree} scope={{ item: scopedProduct, index }} />
                        </div>
                    );
                }

                return (
                    <ProductCard
                        key={product.id}
                        product={product}
                        href={`${effectiveBasePath}/${product.id}`}
                    />
                );
            })}
        </div>
    );
}

import { formatCurrency } from '@/shared/utils';

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

    const formattedPrice = formatCurrency(price, effectiveCurrency, locale);
    const formattedOriginalPrice = originalPrice ? formatCurrency(originalPrice, effectiveCurrency, locale) : null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...style }} className={className} {...rest}>
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formattedPrice}</span>
            {formattedOriginalPrice && originalPrice && originalPrice > price && (
                <span style={{ textDecoration: 'line-through', color: 'var(--muted-foreground)' }}>
                    {formattedOriginalPrice}
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
    variants: propVariants,
    selected: propSelected,
    onChange,
    style,
    className,
    ...rest
}: VariantSelectorProps) {
    const { context, setUIState } = useRuntimeContext();

    // Use props if provided, otherwise fallback to context
    const variants = (propVariants && propVariants.length > 0) ? propVariants : (context?.product?.variants || []);
    const selected = propSelected || context?.uiState?.selectedVariantId;

    const handleChange = (variantId: string) => {
        if (onChange) {
            onChange(variantId);
        } else {
            setUIState('selectedVariantId', variantId);
        }
    };

    if (variants.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', ...style }} className={className} {...rest}>
            {variants.map((variant) => (
                <button
                    key={variant.id}
                    onClick={() => handleChange(variant.id)}
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
            onClick={(event) => {
                event.stopPropagation();
                onClick?.();
            }}
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
            onClick={(event) => {
                event.stopPropagation();
                onClick?.();
            }}
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

// ==================== CartItemCard ====================
interface CartItemCardProps extends BaseComponentProps {
    item?: CartItemContext;
    currency?: string;
    showImage?: boolean;
    showQuantity?: boolean;
    showRemove?: boolean;
    showVariant?: boolean;
}

function CartItemCard({
    item,
    currency,
    showImage = true,
    showQuantity = true,
    showRemove = true,
    showVariant = true,
    style,
    className,
    ...rest
}: CartItemCardProps) {
    const { context, dispatch } = useRuntimeContext();
    const effectiveCurrency = currency || context?.store?.currency || 'USD';
    const effectiveItem = item ?? context?.cart?.items?.[0];

    if (!effectiveItem) return null;

    const imageUrl = effectiveItem.product.images?.[0]?.url || effectiveItem.product.image || effectiveItem.variant?.images?.[0]?.url;
    const variantLabel = effectiveItem.variant?.sku || effectiveItem.variantId;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: showImage ? '72px 1fr' : '1fr',
                gap: '0.75rem',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--background)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {showImage && (
                <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--muted)', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative' }}>
                    {imageUrl ? (
                        <NextImage src={imageUrl} alt={effectiveItem.product.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                            No image
                        </div>
                    )}
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, lineHeight: 1.2 }}>{effectiveItem.product.name}</p>
                        {showVariant && variantLabel && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{variantLabel}</p>
                        )}
                    </div>
                    {showRemove && (
                        <button
                            aria-label="Remove item"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--muted-foreground)' }}
                            onClick={() => dispatch({
                                actionId: 'REMOVE_FROM_CART',
                                payload: { variantId: effectiveItem.variantId }
                            }, context)}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {showQuantity && (
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>Qty: {effectiveItem.quantity}</span>
                    )}
                    <span style={{ fontWeight: 600 }}>{formatCurrency(effectiveItem.lineTotal, effectiveCurrency)}</span>
                </div>
            </div>
        </div>
    )
}

// ==================== CartSidebar ====================
interface CartSidebarProps extends BaseComponentProps {
    isOpen?: boolean;
    items?: CartItemContext[];
    subtotal?: number;
    total?: number;
    currency?: string;
    onClose?: () => void;
    checkoutButtonText?: string;
}

export function CartSidebar({
    isOpen: propIsOpen,
    items,
    subtotal,
    total,
    currency,
    onClose,
    checkoutButtonText = 'Checkout',
    style,
    className,
    ...rest
}: CartSidebarProps) {
    const { context, setUIState } = useRuntimeContext();
    const slug = context?.store?.slug;

    // Controlled vs Uncontrolled state
    const isOpen = propIsOpen ?? context?.uiState?.cartSidebarOpen ?? false;

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (onClose) onClose();
            setUIState('cartSidebarOpen', false);
        }
    };

    // Use context data if props not provided
    const cartItems = items ?? context?.cart?.items ?? [];
    const cartSubtotal = subtotal ?? context?.cart?.subtotal ?? 0;
    const cartTotal = total ?? context?.cart?.total ?? 0;
    const effectiveCurrency = currency || context?.store?.currency || 'USD';

    const checkoutLink = slug ? `/store/${slug}/checkout` : '/checkout';

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent
                style={{ ...style }}
                className={className}
                {...rest}
            >
                <SheetHeader>
                    <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>

                <div style={{ flex: 1, overflow: 'auto', padding: '1rem 0' }} className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {cartItems.length === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', marginTop: '2rem' }}>Your cart is empty</p>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                }}
                            >
                                {cartItems.map((item, index) => {
                                    // Resolve prefab (allow overriding via prefabs context)
                                    const prefabs = context?.prefabs || {};
                                    const prefabKey = 'CartItemCard';
                                    const prefabTree = prefabs[prefabKey] || cartItemCardPrefab;

                                    if (prefabTree) {
                                        return (
                                            <div key={item.id} style={{ display: 'contents' }}>
                                                <Renderer tree={prefabTree} scope={{ item, index }} />
                                            </div>
                                        );
                                    }

                                    return (
                                        <CartItemCard
                                            key={item.id}
                                            item={item}
                                            currency={effectiveCurrency}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {cartItems.length > 0 && (
                        <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Subtotal:</span>
                                <span>{formatCurrency(cartSubtotal, effectiveCurrency)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.125rem' }}>
                                <span>Total:</span>
                                <span>{formatCurrency(cartTotal, effectiveCurrency)}</span>
                            </div>
                            <NextLink href={checkoutLink} onClick={() => handleOpenChange(false)} style={{ display: 'block', marginTop: '1rem' }}>
                                <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 500, cursor: 'pointer' }}>
                                    {checkoutButtonText}
                                </button>
                            </NextLink>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet >
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
            productSchemaId: { type: 'productSchema', label: 'Product Schema ID' },
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
            styles: { base: { width: 'fit-content' } },
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
            styles: { base: { width: 'fit-content' } },
        },
    });

    registerComponent('CartItemCard', CartItemCard as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CartItemCard',
        displayName: 'Cart Item Card',
        category: 'commerce',
        icon: 'CreditCard',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('CartSidebar', CartSidebar as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CartSidebar',
        displayName: 'Cart Sidebar',
        category: 'commerce',
        icon: 'ShoppingCart',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        controls: {
            checkoutButtonText: { type: 'text', label: 'Checkout Button Text', defaultValue: 'Checkout' },
        },
        defaults: {
            props: { isOpen: false, checkoutButtonText: 'Checkout' },
            styles: {},
        },
    });
}
