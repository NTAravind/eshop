import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Schema-aware OrderCard prefab
 * Displays order summary with header, status, items list, and total
 * Fully customizable - users can edit any part of this structure
 */
export const orderCardPrefab: StorefrontNode = {
    id: 'OrderCard_default',
    type: 'Container',
    props: {},
    styles: {
        base: {
            padding: '1.5rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--card)',
            marginBottom: '1rem',
        },
    },
    children: [
        // Order header with ID and date
        {
            id: 'order_card_header',
            type: 'Row',
            props: {},
            styles: {
                base: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border)',
                },
            },
            children: [
                {
                    id: 'order_card_id',
                    type: 'Heading',
                    props: {
                        level: 3,
                    },
                    bindings: {
                        text: 'order.orderNumber',
                    },
                    styles: {
                        base: {
                            fontSize: '1.125rem',
                            fontWeight: '600',
                        },
                    },
                },
                {
                    id: 'order_card_date',
                    type: 'Text',
                    props: {},
                    bindings: {
                        text: 'order.createdAt',
                    },
                    styles: {
                        base: {
                            color: 'var(--muted-foreground)',
                            fontSize: '0.875rem',
                        },
                    },
                },
            ],
        },
        // Order status badge
        {
            id: 'order_card_status',
            type: 'Container',
            props: {},
            styles: {
                base: {
                    marginBottom: '1rem',
                },
            },
            children: [
                {
                    id: 'order_status_badge',
                    type: 'Text',
                    props: {},
                    bindings: {
                        text: 'order.status',
                    },
                    styles: {
                        base: {
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            backgroundColor: 'var(--muted)',
                            color: 'var(--foreground)',
                        },
                    },
                },
            ],
        },
        // Order items list (repeater for products)
        {
            id: 'order_card_items',
            type: 'Repeater',
            props: {},
            bindings: {
                items: 'order.items',
            },
            styles: {
                base: {
                    marginBottom: '1rem',
                },
            },
            children: [
                {
                    id: 'order_item',
                    type: 'Row',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            gap: '1rem',
                            padding: '0.75rem 0',
                            borderBottom: '1px solid var(--border)',
                        },
                    },
                    children: [
                        {
                            id: 'order_item_image',
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
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '0.25rem',
                                },
                            },
                        },
                        {
                            id: 'order_item_details',
                            type: 'Column',
                            props: {},
                            styles: {
                                base: {
                                    flex: 1,
                                },
                            },
                            children: [
                                {
                                    id: 'order_item_name',
                                    type: 'Text',
                                    props: {},
                                    bindings: {
                                        text: 'item.product.name',
                                    },
                                    styles: {
                                        base: {
                                            fontWeight: '500',
                                            marginBottom: '0.25rem',
                                        },
                                    },
                                },
                                {
                                    id: 'order_item_quantity',
                                    type: 'Text',
                                    props: {},
                                    bindings: {
                                        text: 'item.quantity',
                                    },
                                    styles: {
                                        base: {
                                            fontSize: '0.875rem',
                                            color: 'var(--muted-foreground)',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            id: 'order_item_price',
                            type: 'PriceDisplay',
                            props: {},
                            bindings: {
                                price: 'item.totalPrice',
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
            ],
        },
        // Order total
        {
            id: 'order_card_total',
            type: 'Row',
            props: {},
            styles: {
                base: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                },
            },
            children: [
                {
                    id: 'order_total_label',
                    type: 'Text',
                    props: {
                        text: 'Total',
                    },
                    styles: {
                        base: {
                            fontSize: '1.125rem',
                            fontWeight: '600',
                        },
                    },
                },
                {
                    id: 'order_total_value',
                    type: 'PriceDisplay',
                    props: {},
                    bindings: {
                        price: 'order.totalAmount',
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
    ],
};
