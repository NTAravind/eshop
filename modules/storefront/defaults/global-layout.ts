import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';

/**
 * Default global layout with header and footer
 */
export const defaultGlobalLayout: StorefrontNode = {
    id: 'layout_global',
    type: 'Container',
    props: {
        className: 'min-h-screen flex flex-col',
    },
    styleOverrides: {
        base: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
        },
    },
    children: [
        {
            id: 'layout_header',
            type: 'Header',
            props: {},
            children: [
                {
                    id: 'layout_navbar',
                    type: 'PrefabInstance',
                    props: {
                        prefabKey: 'Navbar',
                    },
                },
            ],
        },
        {
            id: 'layout_main',
            type: 'Section',
            props: {
                className: 'flex-1',
            },
            styleOverrides: {
                base: {
                    flex: 1,
                },
            },
            children: [
                {
                    id: 'layout_slot',
                    type: 'Slot',
                    props: {},
                },
            ],
        },
        {
            id: 'layout_footer',
            type: 'Footer',
            props: {
                copyright: '© 2024 Your Store. All rights reserved.',
            },
            bindingMap: {
                storeName: migrateStringBinding('store.name'),
            },
        },
        {
            id: 'layout_cart_sidebar',
            type: 'PrefabInstance',
            props: {
                prefabKey: 'CartSidebar',
            },
        },
    ],
};
