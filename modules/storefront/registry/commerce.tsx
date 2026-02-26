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
    name?: string;
    price?: number;
    originalPrice?: number;
    imageUrl?: string;
    description?: string;
    badge?: string;
    ctaLabel?: string;
}

function ProductCard({
    product,
    href,
    name,
    price,
    originalPrice,
    imageUrl,
    description,
    badge,
    ctaLabel = 'View product',
    style,
    className,
    onClick,
    ...rest
}: ProductCardProps) {
    const { context, setUIState } = useRuntimeContext();
    const slug = context?.store?.slug;

    // Use product context as primary source, props as overrides/fallbacks
    const resolvedProduct = product || {
        id: 'sample-product',
        name: name || 'Sample product',
        description: description || 'This is a sample product description.',
        images: imageUrl ? [{ url: imageUrl, alt: name || 'Sample product', position: 0 }] : [],
        variants: [{
            id: 'sample-variant',
            sku: 'SAMPLE',
            price: price ?? 1999,
            stock: 10,
            customData: {},
            images: imageUrl ? [{ url: imageUrl, alt: name || 'Sample product', position: 0 }] : [],
            isActive: true,
        }],
        customData: {},
        categoryId: '',
    } as ProductContext;

    const defaultVariant = resolvedProduct.variants[0];
    const imageObj = resolvedProduct.images[0] ?? defaultVariant?.images[0];
    const finalImageUrl = imageUrl || imageObj?.url || resolvedProduct.image;
    const finalImageAlt = imageObj?.alt || name || resolvedProduct.name;
    const finalName = name || resolvedProduct.name;
    const finalDescription = description || resolvedProduct.description;
    const finalPrice = price ?? defaultVariant?.price;
    const finalOriginalPrice = originalPrice;

    const cardBody = (
        <div
            style={style}
            className={`group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden ${className || ''}`}
            onClick={onClick}
            {...rest}
        >
            <div className="relative aspect-square bg-muted overflow-hidden">
                {finalImageUrl && (
                    <NextImage
                        src={finalImageUrl}
                        alt={finalImageAlt || finalName}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                )}
                {badge && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full shadow-sm">
                        {badge}
                    </span>
                )}
            </div>
            <div className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{finalName}</h3>
                {finalDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{finalDescription}</p>
                )}
                {finalPrice !== undefined && (
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <PriceDisplay price={finalPrice} originalPrice={finalOriginalPrice} currency={context?.store?.currency} />
                    </div>
                )}
                {ctaLabel && (
                    <button
                        className="mt-2 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            setUIState?.('cartSidebarOpen', true);
                        }}
                        type="button"
                    >
                        {ctaLabel}
                    </button>
                )}
            </div>
        </div>
    );

    // Resolve href
    let finalHref = href;
    if (!finalHref && resolvedProduct.id) {
        finalHref = `/products/${resolvedProduct.id}`;
    }
    if (finalHref && slug && finalHref.startsWith('/') && !finalHref.startsWith('/store/')) {
        finalHref = `/store/${slug}${finalHref}`;
    }

    if (finalHref) {
        return (
            <NextLink href={finalHref} className="block">
                {cardBody}
            </NextLink>
        );
    }

    return cardBody;
}

// ==================== ProductGrid ====================
interface ProductGridProps extends BaseComponentProps {
    products?: ProductContext[];
    columns?: number;
    limit?: number;
    basePath?: string;
    /** Filter by product schema ID */
    productSchemaId?: string;
    /** Specific prefab ID to use for the cards */
    cardPrefabKey?: string;
    /** Mode for selecting card prefab: 'perSchema' uses schema-specific cards, 'fixed' uses default */
    cardPrefabKeyMode?: 'perSchema' | 'fixed';
}

function ProductGrid({
    products = [],
    /* eslint-disable @typescript-eslint/no-unused-vars */
    columns: _columns = 4,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    cardPrefabKeyMode: _cardPrefabKeyMode = 'fixed',
    cardPrefabKey,
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
    const defaultCardKey = 'ProductCard_default';
    const defaultCardPrefab = prefabs[defaultCardKey] || productCardPrefab;

    const resolveCardPrefabKey = (product: ProductContext) => {
        if (_cardPrefabKeyMode === 'perSchema' && product.productSchemaId) {
            const schemaKey = `ProductCard_default:${product.productSchemaId}`;
            if (prefabs[schemaKey]) {
                return schemaKey;
            }
        }
        if (_cardPrefabKeyMode === 'fixed' && cardPrefabKey && prefabs[cardPrefabKey]) {
            return cardPrefabKey;
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
                    const price = defaultVariant?.price ?? (product as any).price ?? 0;
                    const scopedProduct = {
                        ...product,
                        defaultVariant,
                        price,
                        href: `${effectiveBasePath}/${product.id}`,
                    };

                    const scope: any = { product: scopedProduct, item: scopedProduct, index };

                    return (
                        <div key={product.id} style={{ display: 'contents' }}>
                            <Renderer tree={prefabTree} scope={scope} />
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

// ==================== QuantitySelector ====================
interface QuantitySelectorProps extends BaseComponentProps {
    value?: number;
    itemId?: string;
    onChange?: (quantity: number) => void;
}

function QuantitySelector({ value = 1, onChange, itemId, style, className, ...rest }: QuantitySelectorProps) {
    const updateQty = (delta: number) => {
        const nextQty = Math.max(1, value + delta);
        if (onChange) {
            onChange(nextQty);
        }
    };
    return (
        <div
            data-item-id={itemId}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.4rem', backgroundColor: 'var(--background)', ...style }}
            className={className}
            {...rest}
        >
            <button type="button" aria-label="Decrease quantity" onClick={() => updateQty(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: 'var(--foreground)' }}>-</button>
            <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 600 }}>{value}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => updateQty(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: 'var(--foreground)' }}>+</button>
        </div>
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

    const imageUrl = effectiveItem.variant?.images?.[0]?.url || effectiveItem.product.images?.[0]?.url || effectiveItem.product.image;
    const variantLabel = effectiveItem.variant?.sku || effectiveItem.variantId;

    const updateQty = (delta: number) => {
        const nextQty = Math.max(1, (effectiveItem.quantity || 1) + delta);
        dispatch({ actionId: 'UPDATE_QUANTITY', payload: { variantId: effectiveItem.variantId, quantity: nextQty } }, context);
    };

    const removeItem = () => {
        dispatch({ actionId: 'REMOVE_FROM_CART', payload: { variantId: effectiveItem.variantId } }, context);
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: showImage ? '104px 1fr 110px' : '1fr 110px',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '1rem',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 14px 38px rgba(0,0,0,0.08)',
                alignItems: 'center',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {showImage && (
                <div style={{ width: '104px', height: '104px', borderRadius: '0.8rem', overflow: 'hidden', backgroundColor: 'var(--muted)', position: 'relative' }}>
                    {imageUrl ? (
                        <NextImage src={imageUrl} alt={effectiveItem.product.name || 'Cart item'} fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
                            No image
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {effectiveItem.product.name || 'Untitled item'}
                        </p>
                        {showVariant && variantLabel && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{variantLabel}</p>
                        )}
                    </div>
                    {showRemove && (
                        <button
                            aria-label="Remove item"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--muted-foreground)' }}
                            onClick={removeItem}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {showQuantity && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.4rem', backgroundColor: 'var(--background)' }}>
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => updateQty(-1)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: 'var(--foreground)' }}
                            >
                                -
                            </button>
                            <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 600 }}>{effectiveItem.quantity}</span>
                            <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => updateQty(1)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: 'var(--foreground)' }}
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <PriceDisplay price={effectiveItem.lineTotal} currency={effectiveCurrency} />
            </div>
        </div>
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
    checkoutButtonText?: string;
    children?: React.ReactNode;
}

export function CartSidebar({
    isOpen: propIsOpen,
    items,
    subtotal,
    total,
    currency,
    onClose,
    checkoutButtonText = 'Checkout',
    children,
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

    const hasChildren = React.Children.count(children) > 0;

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent
                style={{ ...style }}
                className={className}
                {...rest}
            >
                {hasChildren ? (
                    children
                ) : (
                    <>
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
                    </>
                )}
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
        propsSchema: {
            href: { type: 'text', label: 'Link Override' },
            name: { type: 'text', label: 'Title' },
            description: { type: 'textarea', label: 'Description' },
            imageUrl: { type: 'image', label: 'Image' },
            price: { type: 'number', label: 'Price (cents)', min: 0 },
            originalPrice: { type: 'number', label: 'Original Price (cents)', min: 0 },
            badge: { type: 'text', label: 'Badge' },
            ctaLabel: { type: 'text', label: 'Button Label', defaultValue: 'View product' },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            styleOverrides: {
                base: {
                    width: '280px',
                    maxWidth: '320px',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }
            },
            props: {
                name: 'Sample product',
                description: 'A short description for preview.',
                price: 1999,
                originalPrice: 2499,
                imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
                badge: 'Bestseller',
                ctaLabel: 'View product',
            },
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
            cardPrefabKey: { type: 'prefab', prefabType: 'productcard', label: 'Custom Card Prefab Key' },
            basePath: { type: 'text', label: 'Base Product Link Path' },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: { columns: 4, limit: 8, cardPrefabKeyMode: 'fixed' },
            styleOverrides: { base: { margin: '2rem 0' } },
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
            styleOverrides: {},
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
            styleOverrides: {},
        },
    });

    registerComponent('AddToCartButton', AddToCartButton as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'AddToCartButton',
        displayName: 'Add to Cart',
        category: 'commerce',
        icon: 'ShoppingCart',
        propsSchema: {},
        actionSlots: ['onClick'],
        constraints: { canHaveChildren: false },
        defaults: {
            props: { text: 'Add to Cart' },
            styleOverrides: { base: { width: 'fit-content' } },
        },
    });

    registerComponent('BuyNowButton', BuyNowButton as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'BuyNowButton',
        displayName: 'Buy Now',
        category: 'commerce',
        icon: 'CreditCard',
        propsSchema: {},
        actionSlots: ['onClick'],
        constraints: { canHaveChildren: false },
        defaults: {
            props: { text: 'Buy Now' },
            styleOverrides: { base: { width: 'fit-content' } },
        },
    });

    registerComponent('QuantitySelector', QuantitySelector as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'QuantitySelector',
        displayName: 'Quantity Selector',
        category: 'commerce',
        icon: 'Plus',
        propsSchema: {
            value: { type: 'number', label: 'Value', defaultValue: 1 },
        },
        actionSlots: ['onChange'],
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styleOverrides: {},
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
            styleOverrides: {},
        },
    });

    registerComponent('CartSidebar', CartSidebar as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CartSidebar',
        displayName: 'Cart Sidebar',
        category: 'commerce',
        icon: 'ShoppingCart',
        propsSchema: {},
        constraints: { canHaveChildren: true },
        controls: {
            checkoutButtonText: { type: 'text', label: 'Checkout Button Text', defaultValue: 'Checkout' },
        },
        defaults: {
            props: { isOpen: false, checkoutButtonText: 'Checkout' },
            styleOverrides: {},
            children: [],
        },
    });
}
