import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Schema-aware ProductCard prefab
 * Binds to product data and displays image, name, price, and add to cart
 */
export const productCardPrefab: StorefrontNode = {
    id: 'ProductCard_default',
    type: 'Container',
    props: {},
    styles: {
        base: {
            width: '100%',
            maxWidth: '300px',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            transition: 'all 0.2s',
            cursor: 'pointer',
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
            bindings: {
                src: 'product.defaultVariant.images[0].url',
                alt: 'product.name',
            },
            styles: {
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
            styles: {
                base: {
                    padding: '1rem',
                },
            },
            children: [
                {
                    id: 'product_card_name',
                    type: 'Heading',
                    props: {
                        level: 3,
                    },
                    bindings: {
                        text: 'product.name',
                    },
                    styles: {
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
                    bindings: {
                        // Example: Use customData for schema-specific fields
                        // For shoes: product.customData.material
                        // For clothing: product.customData.fabric
                        text: 'product.description',
                    },
                    styles: {
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
                    bindings: {
                        price: 'product.defaultVariant.price',
                        currency: 'store.currency',
                    },
                    styles: {
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
                    actions: {
                        onClick: {
                            actionId: 'ADD_TO_CART',
                            payloadBindings: {
                                variantId: 'product.defaultVariant.id',
                            },
                            payload: {
                                quantity: 1,
                                openCart: true,
                            },
                        },
                    },
                    styles: {
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
