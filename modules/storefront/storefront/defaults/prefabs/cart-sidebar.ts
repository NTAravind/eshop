import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Schema-aware CartSidebar prefab
 * Displays cart items with images, quantities, prices, and checkout button
 */
export const cartSidebarPrefab: StorefrontNode = {
    id: 'CartSidebar_default',
    type: 'Container',
    props: {},
    styles: {
        base: {
            width: '100%',
            maxWidth: '400px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--background)',
        },
    },
    children: [
        // Cart header
        {
            id: 'cart_header',
            type: 'Container',
            props: {},
            styles: {
                base: {
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border)',
                },
            },
            children: [
                {
                    id: 'cart_title',
                    type: 'Heading',
                    props: {
                        level: 2,
                        text: 'Shopping Cart',
                    },
                    styles: {
                        base: {
                            fontSize: '1.5rem',
                            fontWeight: '700',
                        },
                    },
                },
                {
                    id: 'cart_item_count',
                    type: 'Text',
                    props: {},
                    bindings: {
                        text: 'cart.itemCount',
                    },
                    styles: {
                        base: {
                            fontSize: '0.875rem',
                            color: 'var(--muted-foreground)',
                            marginTop: '0.25rem',
                        },
                    },
                },
            ],
        },
        // Cart items (scrollable)
        {
            id: 'cart_items_container',
            type: 'Container',
            props: {},
            styles: {
                base: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                },
            },
            children: [
                {
                    id: 'cart_items_repeater',
                    type: 'Repeater',
                    props: {},
                    bindings: {
                        items: 'cart.items',
                    },
                    children: [
                        {
                            id: 'cart_item',
                            type: 'Row',
                            props: {},
                            styles: {
                                base: {
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1rem 0',
                                    borderBottom: '1px solid var(--border)',
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
                                        src: 'item.variant.images[0].url',
                                        alt: 'item.product.name',
                                    },
                                    styles: {
                                        base: {
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '0.375rem',
                                        },
                                    },
                                },
                                {
                                    id: 'cart_item_details',
                                    type: 'Column',
                                    props: {},
                                    styles: {
                                        base: {
                                            flex: 1,
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
                                                    fontWeight: '600',
                                                    marginBottom: '0.25rem',
                                                },
                                            },
                                        },
                                        {
                                            id: 'cart_item_variant',
                                            type: 'Text',
                                            props: {},
                                            bindings: {
                                                text: 'item.variant.title',
                                            },
                                            styles: {
                                                base: {
                                                    fontSize: '0.875rem',
                                                    color: 'var(--muted-foreground)',
                                                    marginBottom: '0.5rem',
                                                },
                                            },
                                        },
                                        {
                                            id: 'cart_item_qty_row',
                                            type: 'Row',
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
                                                    type: 'QuantitySelector',
                                                    props: {},
                                                    bindings: {
                                                        value: 'item.quantity',
                                                        itemId: 'item.id',
                                                    },
                                                },
                                                {
                                                    id: 'cart_item_price',
                                                    type: 'PriceDisplay',
                                                    props: {},
                                                    bindings: {
                                                        price: 'item.totalPrice',
                                                        currency: 'store.currency',
                                                    },
                                                    styles: {
                                                        base: {
                                                            fontWeight: '700',
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        // Cart footer with total and checkout
        {
            id: 'cart_footer',
            type: 'Container',
            props: {},
            styles: {
                base: {
                    padding: '1.5rem',
                    borderTop: '1px solid var(--border)',
                },
            },
            children: [
                {
                    id: 'cart_subtotal_row',
                    type: 'Row',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                        },
                    },
                    children: [
                        {
                            id: 'cart_subtotal_label',
                            type: 'Text',
                            props: {
                                text: 'Subtotal',
                            },
                            styles: {
                                base: {
                                    fontSize: '0.875rem',
                                    color: 'var(--muted-foreground)',
                                },
                            },
                        },
                        {
                            id: 'cart_subtotal_value',
                            type: 'PriceDisplay',
                            props: {},
                            bindings: {
                                price: 'cart.subtotal',
                                currency: 'store.currency',
                            },
                            styles: {
                                base: {
                                    fontWeight: '600',
                                },
                            },
                        },
                    ],
                },
                {
                    id: 'cart_total_row',
                    type: 'Row',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border)',
                        },
                    },
                    children: [
                        {
                            id: 'cart_total_label',
                            type: 'Text',
                            props: {
                                text: 'Total',
                            },
                            styles: {
                                base: {
                                    fontSize: '1.125rem',
                                    fontWeight: '700',
                                },
                            },
                        },
                        {
                            id: 'cart_total_value',
                            type: 'PriceDisplay',
                            props: {},
                            bindings: {
                                price: 'cart.total',
                                currency: 'store.currency',
                            },
                            styles: {
                                base: {
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    color: 'var(--primary)',
                                },
                            },
                        },
                    ],
                },
                {
                    id: 'cart_checkout_button',
                    type: 'Button',
                    props: {
                        text: 'Proceed to Checkout',
                        variant: 'primary',
                    },
                    actions: {
                        onClick: {
                            actionId: 'NAVIGATE',
                            payload: {
                                href: '/checkout',
                            },
                        },
                    },
                    styles: {
                        base: {
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                        },
                    },
                },
            ],
        },
    ],
};
