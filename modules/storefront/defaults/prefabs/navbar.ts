import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../../binding-ast';
import { migrateActionRef } from '../../actions/pipeline';

/**
 * Schema-aware Navbar prefab
 * Full navigation bar with logo, links, cart, and user menu
 * Fully customizable structure
 */
export const navbarPrefab: StorefrontNode = {
    id: 'Navbar_default',
    type: 'Container',
    props: {},
    styleOverrides: {
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
            styleOverrides: {
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
                    type: 'NavItem',
                    props: {
                        href: '/',
                    },
                    styleOverrides: {
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
                            bindingMap: {
                                text: migrateStringBinding('store.name'),
                            },
                        },
                    ],
                },
                // Navigation links
                {
                    id: 'navbar_links',
                    type: 'Row',
                    props: {},
                    styleOverrides: {
                        base: {
                            display: 'flex',
                            gap: '2rem',
                            alignItems: 'center',
                        },
                    },
                    children: [
                        {
                            id: 'navbar_link_home',
                            type: 'NavItem',
                            props: {
                                href: '/',
                                text: 'Home',
                            },
                            styleOverrides: {
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
                            type: 'NavItem',
                            props: {
                                href: '/collection',
                                text: 'Shop',
                            },
                            styleOverrides: {
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
                    styleOverrides: {
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
                            styleOverrides: {
                                base: {
                                    position: 'relative',
                                    cursor: 'pointer',
                                },
                            },
                            actionMap: {
                                onClick: migrateActionRef({
                                    actionId: 'OPEN_CART_SIDEBAR',
                                    payload: {
                                        open: true,
                                    },
                                }),
                            },
                            children: [
                                {
                                    id: 'navbar_cart_icon',
                                    type: 'Text',
                                    props: {
                                        text: '🛒'
                                    },
                                    styleOverrides: {
                                        base: {
                                            fontSize: '1.25rem',
                                        },
                                    }
                                },
                                {
                                    id: 'navbar_cart_badge',
                                    type: 'Text',
                                    props: {},
                                    bindingMap: {
                                        text: migrateStringBinding('cart.itemCount'),
                                    },
                                    styleOverrides: {
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
                            type: 'NavItem',
                            props: {
                                href: '/login',
                                label: 'Account',
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
