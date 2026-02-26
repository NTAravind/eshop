import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../../binding-ast';
import { migrateActionRef } from '../../actions/pipeline';
import { cartItemCardPrefab } from './cart-item-card';

/**
 * Schema-aware CartSidebar prefab
 * Displays cart items with images, quantities, prices, and checkout button
 */
export const cartSidebarPrefab: StorefrontNode = {
    id: 'CartSidebar_default',
    type: 'CartSidebar',
    props: {},
    styleOverrides: {
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
            styleOverrides: {
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
                    styleOverrides: {
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
                    bindingMap: {
                        text: migrateStringBinding('cart.itemCount'),
                    },
                    styleOverrides: {
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
            styleOverrides: {
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
                    bindingMap: {
                        items: migrateStringBinding('cart.items'),
                    },
                    children: [
                        {
                            // Use cart item card prefab as the template inside the repeater
                            ...cartItemCardPrefab,
                            id: 'cart_item_prefab',
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
            styleOverrides: {
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
                    styleOverrides: {
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
                            styleOverrides: {
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
                            bindingMap: {
                                price: migrateStringBinding('cart.subtotal'),
                                currency: migrateStringBinding('store.currency'),
                            },
                            styleOverrides: {
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
                    styleOverrides: {
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
                            styleOverrides: {
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
                            bindingMap: {
                                price: migrateStringBinding('cart.total'),
                                currency: migrateStringBinding('store.currency'),
                            },
                            styleOverrides: {
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
                    actionMap: {
                        onClick: migrateActionRef({
                            actionId: 'NAVIGATE',
                            payload: {
                                to: '/checkout',
                            },
                        }),
                    },
                    styleOverrides: {
                        base: {
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                        },
                    },
                },
                {
                    id: 'cart_go_to_store_button',
                    type: 'Button',
                    props: {
                        text: 'Go to Store',
                        variant: 'outline',
                    },
                    actionMap: {
                        onClick: migrateActionRef({
                            actionId: 'NAVIGATE',
                            payload: {
                                to: '/collections',
                            },
                        }),
                    },
                    styleOverrides: {
                        base: {
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginTop: '0.75rem',
                        },
                    },
                },
            ],
        },
    ],
};
