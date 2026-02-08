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
                    type: 'Navbar',
                    props: {},
                    bindings: {
                        storeName: 'store.name',
                        logoUrl: 'store.logoUrl',
                    },
                    children: [
                        {
                            id: 'nav_home',
                            type: 'NavItem',
                            props: {
                                label: 'Home',
                                href: '/',
                            },
                        },
                        {
                            id: 'nav_shop',
                            type: 'NavItem',
                            props: {
                                label: 'Shop',
                                href: '/collection',
                            },
                        },
                    ],
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
            type: 'CartSidebar',
            props: {},
            bindings: {
                isOpen: 'uiState.cartSidebarOpen',
                items: 'cart.items',
                subtotal: 'cart.subtotal',
                total: 'cart.total',
                currency: 'store.currency',
            },
        },
    ],
};
