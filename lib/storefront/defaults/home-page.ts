import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Default home page
 */
export const defaultHomePage: StorefrontNode = {
    id: 'page_home',
    type: 'Container',
    props: {},
    children: [
        // Hero section
        {
            id: 'home_hero',
            type: 'Section',
            props: {
                className: 'hero',
            },
            styles: {
                base: {
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--muted)',
                },
            },
            children: [
                {
                    id: 'hero_heading',
                    type: 'Heading',
                    props: {
                        level: 1,
                        text: 'Welcome to Our Store',
                    },
                    bindings: {
                        text: 'store.name',
                    },
                    styles: {
                        base: {
                            fontSize: '3rem',
                            fontWeight: 700,
                            marginBottom: '1rem',
                        },
                    },
                },
                {
                    id: 'hero_subtext',
                    type: 'Text',
                    props: {
                        text: 'Discover our amazing collection of products',
                    },
                    styles: {
                        base: {
                            fontSize: '1.25rem',
                            color: 'var(--muted-foreground)',
                            marginBottom: '2rem',
                        },
                    },
                },
                {
                    id: 'hero_cta',
                    type: 'Button',
                    props: {
                        variant: 'default',
                        text: 'Shop Now',
                    },
                    actions: {
                        onClick: {
                            actionId: 'NAVIGATE',
                            payload: { to: '/collection' },
                        },
                    },
                },
            ],
        },
        // Featured products section
        {
            id: 'home_featured',
            type: 'Section',
            props: {},
            styles: {
                base: {
                    padding: '4rem 2rem',
                },
            },
            children: [
                {
                    id: 'featured_heading',
                    type: 'Heading',
                    props: {
                        level: 2,
                        text: 'Featured Products',
                    },
                    styles: {
                        base: {
                            textAlign: 'center',
                            marginBottom: '2rem',
                        },
                    },
                },
                {
                    id: 'featured_grid',
                    type: 'ProductGrid',
                    props: {
                        columns: 4,
                        limit: 8,
                    },
                    bindings: {
                        products: 'collection.products',
                    },
                },
            ],
        },
    ],
};
