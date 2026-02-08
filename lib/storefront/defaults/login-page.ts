import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Default login page with OAuth authentication
 */
export const defaultLoginPage: StorefrontNode = {
    id: 'page_login',
    type: 'Container',
    props: {},
    styles: {
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
            styles: {
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
                    styles: {
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
                            bindings: {
                                text: 'store.name',
                            },
                            styles: {
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
                            styles: {
                                base: {
                                    color: 'var(--muted-foreground)',
                                    fontSize: '1rem',
                                },
                            },
                        },
                    ],
                },
                {
                    id: 'oauth_buttons',
                    type: 'OAuthButtons',
                    props: {
                        providers: ['google', 'instagram'],
                    },
                    bindings: {
                        callbackUrl: 'route.searchParams.redirect',
                    },
                },
                {
                    id: 'login_footer',
                    type: 'Text',
                    props: {
                        text: 'By signing in, you agree to our Terms of Service and Privacy Policy.',
                    },
                    styles: {
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
