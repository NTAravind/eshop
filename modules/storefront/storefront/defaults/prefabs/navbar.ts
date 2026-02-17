import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Schema-aware Navbar prefab
 * Full navigation bar with logo, links, cart, and user menu
 * Fully customizable structure
 */
export const navbarPrefab: StorefrontNode = {
    id: 'Navbar_default',
    type: 'Container',
    props: {},
    styles: {
        base: {
            width: '100%',
            padding: '1rem 2rem',
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        },
    },
    children: [
        {
            id: 'navbar_content',
            type: 'Row',
            props: {},
            styles: {
                base: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1400px',
                    margin: '0 auto',
                },
            },
            children: [
                // Logo
                {
                    id: 'navbar_logo',
                    type: 'Link',
                    props: {
                        href: '/',
                    },
                    styles: {
                        base: {
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--foreground)',
                            textDecoration: 'none',
                        },
                    },
                    children: [
                        {
                            id: 'navbar_logo_text',
                            type: 'Text',
                            props: {},
                            bindings: {
                                text: 'store.name',
                            },
                        },
                    ],
                },
                // Navigation links
                {
                    id: 'navbar_links',
                    type: 'Row',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            gap: '2rem',
                            alignItems: 'center',
                        },
                    },
                    children: [
                        {
                            id: 'navbar_link_home',
                            type: 'Link',
                            props: {
                                href: '/',
                                text: 'Home',
                            },
                            styles: {
                                base: {
                                    color: 'var(--foreground)',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                },
                                hover: {
                                    color: 'var(--primary)',
                                },
                            },
                        },
                        {
                            id: 'navbar_link_shop',
                            type: 'Link',
                            props: {
                                href: '/collection',
                                text: 'Shop',
                            },
                            styles: {
                                base: {
                                    color: 'var(--foreground)',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                },
                                hover: {
                                    color: 'var(--primary)',
                                },
                            },
                        },
                    ],
                },
                // Right side actions
                {
                    id: 'navbar_actions',
                    type: 'Row',
                    props: {},
                    styles: {
                        base: {
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                        },
                    },
                    children: [
                        // Cart icon with badge
                        {
                            id: 'navbar_cart',
                            type: 'Container',
                            props: {},
                            styles: {
                                base: {
                                    position: 'relative',
                                    cursor: 'pointer',
                                },
                            },
                            actions: {
                                onClick: {
                                    actionId: 'TOGGLE_CART',
                                },
                            },
                            children: [
                                {
                                    id: 'navbar_cart_icon',
                                    type: 'Icon',
                                    props: {
                                        name: 'shopping-cart',
                                        size: 24,
                                    },
                                },
                                {
                                    id: 'navbar_cart_badge',
                                    type: 'Text',
                                    props: {},
                                    bindings: {
                                        text: 'cart.itemCount',
                                    },
                                    styles: {
                                        base: {
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            backgroundColor: 'var(--primary)',
                                            color: 'var(--primary-foreground)',
                                            borderRadius: '9999px',
                                            minWidth: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            padding: '0 4px',
                                        },
                                    },
                                },
                            ],
                        },
                        // User menu button
                        {
                            id: 'navbar_user',
                            type: 'UserMenuButton',
                            props: {},
                            bindings: {
                                user: 'user',
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
