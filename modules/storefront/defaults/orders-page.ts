import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';

/**
 * Default orders page
 */
export const defaultOrdersPage: StorefrontNode = {
    id: 'page_orders',
    type: 'Container',
    props: {},
    styleOverrides: {
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
            styleOverrides: {
                base: {
                    marginBottom: '2rem',
                },
            },
        },
        {
            id: 'orders_list',
            type: 'OrderList',
            props: {},
            bindingMap: {
                orders: migrateStringBinding('orders.results'),
                currency: migrateStringBinding('store.currency'),
            },
        },
    ],
};
