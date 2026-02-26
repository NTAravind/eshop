import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../../binding-ast';
import { migrateActionRef } from '../../actions/pipeline';

/**
 * Schema-aware ProductCard prefab
 * Binds to product data and displays image, name, price, and add to cart
 */
export const productCardPrefab: StorefrontNode = {
    id: 'ProductCard_default',
    type: 'Container',
    props: {},
    actionMap: {
        onClick: migrateActionRef({
            actionId: 'NAVIGATE',
            payloadBindings: {
                to: 'product.href',
            },
        }),
    },
    styleOverrides: {
        base: {
            width: '280px',
            maxWidth: '320px',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            transition: 'all 0.2s',
            cursor: 'pointer',
            display: 'inline-flex',
            flexDirection: 'column',
        },
        hover: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
        },
    },
    children: [
        {
            id: 'product_card_image',
            type: 'Image',
            props: {
                alt: 'Product',
            },
            bindingMap: {
                src: {
                    kind: 'fallback',
                    primary: migrateStringBinding('product.defaultVariant.images[0].url'),
                    fallback: migrateStringBinding('product.images[0].url'),
                },
                alt: {
                    kind: 'fallback',
                    primary: migrateStringBinding('product.name'),
                    fallback: { kind: 'literal', value: 'Product' },
                },
            },
            styleOverrides: {
                base: {
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                },
            },
        },
        {
            id: 'product_card_content',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: {
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                },
            },
            children: [
                {
                    id: 'product_card_name',
                    type: 'Heading',
                    props: {
                        level: 3,
                    },
                    bindingMap: {
                        text: migrateStringBinding('product.name'),
                    },
                    styleOverrides: {
                        base: {
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                        },
                    },
                },
                {
                    id: 'product_card_description',
                    type: 'Text',
                    props: {},
                    bindingMap: {
                        // Example: Use customData for schema-specific fields
                        // For shoes: product.customData.material
                        // For clothing: product.customData.fabric
                        text: migrateStringBinding('product.description'),
                    },
                    styleOverrides: {
                        base: {
                            fontSize: '0.875rem',
                            color: 'var(--muted-foreground)',
                            marginBottom: '0.5rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        },
                    },
                },
                {
                    id: 'product_card_price',
                    type: 'PriceDisplay',
                    props: {},
                    bindingMap: {
                        price: {
                            kind: 'fallback',
                            primary: migrateStringBinding('product.defaultVariant.price'),
                            fallback: migrateStringBinding('product.price'),
                        },
                        currency: migrateStringBinding('store.currency'),
                    },
                    styleOverrides: {
                        base: {
                            fontSize: '1.125rem',
                            fontWeight: '700',
                            color: 'var(--primary)',
                        },
                    },
                },
                {
                    id: 'product_card_button',
                    type: 'AddToCartButton',
                    props: {
                        text: 'Add to Cart',
                    },
                    actionMap: {
                        onClick: migrateActionRef({
                            actionId: 'ADD_TO_CART',
                            payloadBindings: {
                                variantId: 'product.defaultVariant.id',
                            },
                            payload: {
                                quantity: 1,
                                openCart: true,
                            },
                        }),
                    },
                    styleOverrides: {
                        base: {
                            marginTop: '1rem',
                            width: '100%',
                        },
                    },
                },
            ],
        },
    ],
};
