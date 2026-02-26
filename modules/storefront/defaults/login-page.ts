import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';

/**
 * Default login page with OAuth authentication
 */
export const defaultLoginPage: StorefrontNode = {
    id: 'page_login',
    type: 'Container',
    props: {},
    styleOverrides: {
        base: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: 'var(--background)',
        },
    },
    children: [
        {
            id: 'login_card',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: {
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2rem',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
            },
            children: [
                {
                    id: 'login_header',
                    type: 'Column',
                    props: {},
                    styleOverrides: {
                        base: {
                            alignItems: 'center',
                            marginBottom: '2rem',
                        },
                    },
                    children: [
                        {
                            id: 'store_logo',
                            type: 'Heading',
                            props: {
                                level: 1,
                            },
                            bindingMap: {
                                text: migrateStringBinding('store.name'),
                            },
                            styleOverrides: {
                                base: {
                                    fontSize: '1.875rem',
                                    fontWeight: '700',
                                    marginBottom: '0.5rem',
                                },
                            },
                        },
                        {
                            id: 'login_subtitle',
                            type: 'Text',
                            props: {
                                text: 'Sign in to your account',
                            },
                            styleOverrides: {
                                base: {
                                    color: 'var(--muted-foreground)',
                                    fontSize: '1rem',
                                },
                            },
                        },
                    ],
                },
                {
                    id: 'oauth_buttons_container',
                    type: 'Container',
                    props: {},
                    styleOverrides: {
                        base: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            width: '100%',
                        },
                    },
                    children: [
                        {
                            id: 'google_login_button',
                            type: 'Container',
                            props: {},
                            actionMap: {
                                onClick: {
                                    id: 'act_google_login',
                                    steps: [
                                        {
                                            id: 'step_google_login',
                                            actionId: 'OAUTH_LOGIN',
                                            payload: { provider: 'google' },
                                            payloadBindings: {
                                                callbackUrl: {
                                                    kind: 'path',
                                                    root: 'route',
                                                    segments: ['searchParams', 'redirect'],
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                            styleOverrides: {
                                base: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.75rem 1.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                },
                                hover: {
                                    opacity: 0.9,
                                },
                            },
                            children: [
                                {
                                    id: 'google_login_text',
                                    type: 'Text',
                                    props: {
                                        text: 'Continue with Google',
                                    },
                                    styleOverrides: {
                                        base: {
                                            color: 'var(--foreground)',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            id: 'instagram_login_button',
                            type: 'Container',
                            props: {},
                            actionMap: {
                                onClick: {
                                    id: 'act_instagram_login',
                                    steps: [
                                        {
                                            id: 'step_instagram_login',
                                            actionId: 'OAUTH_LOGIN',
                                            payload: { provider: 'instagram' },
                                            payloadBindings: {
                                                callbackUrl: {
                                                    kind: 'path',
                                                    root: 'route',
                                                    segments: ['searchParams', 'redirect'],
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                            styleOverrides: {
                                base: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                                    cursor: 'pointer',
                                },
                                hover: {
                                    opacity: 0.9,
                                },
                            },
                            children: [
                                {
                                    id: 'instagram_login_text',
                                    type: 'Text',
                                    props: {
                                        text: 'Continue with Instagram',
                                    },
                                    styleOverrides: {
                                        base: {
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'login_footer',
                    type: 'Text',
                    props: {
                        text: 'By signing in, you agree to our Terms of Service and Privacy Policy.',
                    },
                    styleOverrides: {
                        base: {
                            marginTop: '1.5rem',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            color: 'var(--muted-foreground)',
                        },
                    },
                },
            ],
        },
    ],
};
