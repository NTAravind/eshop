import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Default orders page
 */
export const defaultOrdersPage: StorefrontNode = {
    id: 'page_orders',
    type: 'Container',
    props: {},
    styles: {
        base: {
            padding: '2rem',
            maxWidth: '1000px',
            margin: '0 auto',
        },
    },
    children: [
        {
            id: 'orders_header',
            type: 'Heading',
            props: {
                level: 1,
                text: 'My Orders',
            },
            styles: {
                base: {
                    marginBottom: '2rem',
                },
            },
        },
        {
            id: 'orders_list',
            type: 'OrderList',
            props: {},
            bindings: {
                orders: 'orders.results',
                currency: 'store.currency',
            },
        },
    ],
};
