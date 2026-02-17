import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Schema-aware CartItemCard prefab
 * Displays cart item image, name, variant, quantity, price, and remove button
 */
export const cartItemCardPrefab: StorefrontNode = {
    id: 'CartItemCard_default',
    type: 'Container',
    props: {},
    styles: {
        base: {
            display: 'grid',
            gridTemplateColumns: '72px 1fr',
            gap: '0.75rem',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--background)',
            marginBottom: '0.75rem',
        },
    },
    children: [
        {
            id: 'cart_item_image_container',
            type: 'Container',
            props: {},
            styles: {
                base: {
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'var(--muted)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    position: 'relative',
                },
            },
            children: [
                {
                    id: 'cart_item_image',
                    type: 'Image',
                    props: {
                        alt: 'Product',
                    },
                    bindings: {
                        src: 'item.product.images[0].url || item.product.image || item.variant.images[0].url',
                        alt: 'item.product.name',
                    },
                    styles: {
                        base: {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        },
                    },
                },
            ],
        },
        {
            id: 'cart_item_details',
            type: 'Container',
            props: {},
            styles: {
                base: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                },
            },
            children: [
                {
                    id: 'cart_item_header',
                    type: 'Container',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                        },
                    },
                    children: [
                        {
                            id: 'cart_item_info',
                            type: 'Container',
                            props: {},
                            styles: {
                                base: {
                                    minWidth: 0,
                                },
                            },
                            children: [
                                {
                                    id: 'cart_item_name',
                                    type: 'Text',
                                    props: {},
                                    bindings: {
                                        text: 'item.product.name',
                                    },
                                    styles: {
                                        base: {
                                            fontWeight: 600,
                                            lineHeight: 1.2,
                                        },
                                    },
                                },
                                {
                                    id: 'cart_item_variant',
                                    type: 'Text',
                                    props: {},
                                    bindings: {
                                        text: 'item.variant.sku || item.variantId',
                                    },
                                    styles: {
                                        base: {
                                            fontSize: '0.75rem',
                                            color: 'var(--muted-foreground)',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            id: 'cart_item_remove_btn',
                            type: 'Button',
                            props: {
                                variant: 'ghost',
                                size: 'icon',
                            },
                            actions: {
                                onClick: {
                                    actionId: 'REMOVE_FROM_CART',
                                    payloadBindings: {
                                        variantId: 'item.variantId',
                                    },
                                },
                            },
                            styles: {
                                base: {
                                    padding: '0.25rem',
                                    height: 'auto',
                                    color: 'var(--muted-foreground)',
                                },
                            },
                            children: [
                                {
                                    id: 'remove_icon',
                                    type: 'Icon',
                                    props: {
                                        name: 'Trash2',
                                        size: 16,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'cart_item_footer',
                    type: 'Container',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        },
                    },
                    children: [
                        {
                            id: 'cart_item_quantity',
                            type: 'Text',
                            props: {},
                            bindings: {
                                text: '"Qty: " + item.quantity',
                            },
                            styles: {
                                base: {
                                    color: 'var(--muted-foreground)',
                                    fontSize: '0.75rem',
                                },
                            },
                        },
                        {
                            id: 'cart_item_price',
                            type: 'PriceDisplay',
                            props: {},
                            bindings: {
                                price: 'item.lineTotal',
                                currency: 'store.currency',
                            },
                            styles: {
                                base: {
                                    fontWeight: 600,
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
