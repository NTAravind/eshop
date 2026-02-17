import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Default global layout with header and footer
 */
export const defaultGlobalLayout: StorefrontNode = {
    id: 'layout_global',
    type: 'Container',
    props: {
        className: 'min-h-screen flex flex-col',
    },
    styles: {
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
            styles: {
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
            bindings: {
                storeName: 'store.name',
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
