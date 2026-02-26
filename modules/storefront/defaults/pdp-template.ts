import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';
import { migrateActionRef } from '../actions/pipeline';

/**
 * Default PDP template
 */
export const defaultPdpTemplate: StorefrontNode = {
    id: 'template_pdp',
    type: 'Container',
    props: {},
    children: [
        {
            id: 'pdp_main',
            type: 'Row',
            props: {},
            styleOverrides: {
                base: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    padding: '2rem',
                },
                lg: {
                    flexDirection: 'row',
                },
            },
            children: [
                // Image gallery
                {
                    id: 'pdp_gallery',
                    type: 'Column',
                    props: {},
                    styleOverrides: {
                        base: {
                            flex: 1,
                        },
                    },
                    children: [
                        {
                            id: 'pdp_image',
                            type: 'Image',
                            props: {
                                alt: 'Product image',
                            },
                            bindingMap: {
                                src: migrateStringBinding('selectedVariant.images[0].url'),
                                alt: migrateStringBinding('product.name'),
                            },
                            styleOverrides: {
                                base: {
                                    width: '100%',
                                    aspectRatio: '1',
                                    objectFit: 'cover',
                                    borderRadius: '0.5rem',
                                },
                            },
                        },
                    ],
                },
                // Product details
                {
                    id: 'pdp_details',
                    type: 'Column',
                    props: {},
                    styleOverrides: {
                        base: {
                            flex: 1,
                        },
                    },
                    children: [
                        {
                            id: 'pdp_title',
                            type: 'Heading',
                            props: {
                                level: 1,
                            },
                            bindingMap: {
                                text: migrateStringBinding('product.name'),
                            },
                        },
                        {
                            id: 'pdp_price',
                            type: 'PriceDisplay',
                            props: {},
                            bindingMap: {
                                price: migrateStringBinding('selectedVariant.price'),
                                currency: migrateStringBinding('store.currency'),
                            },
                        },
                        {
                            id: 'pdp_description',
                            type: 'Text',
                            props: {},
                            bindingMap: {
                                text: migrateStringBinding('product.description'),
                            },
                            styleOverrides: {
                                base: {
                                    marginTop: '1rem',
                                    color: 'var(--muted-foreground)',
                                },
                            },
                        },
                        {
                            id: 'pdp_variants',
                            type: 'VariantSelector',
                            props: {},
                            bindingMap: {
                                variants: migrateStringBinding('product.variants'),
                                selected: migrateStringBinding('selectedVariant.id'),
                            },
                        },
                        {
                            id: 'pdp_actions',
                            type: 'Row',
                            props: {},
                            styleOverrides: {
                                base: {
                                    display: 'flex',
                                    gap: '1rem',
                                    marginTop: '1.5rem',
                                },
                            },
                            children: [
                                {
                                    id: 'pdp_add_cart',
                                    type: 'AddToCartButton',
                                    props: {
                                        text: 'Add to Cart',
                                    },
                                    actionMap: {
                                        onClick: migrateActionRef({
                                            actionId: 'ADD_TO_CART',
                                            payloadBindings: {
                                                variantId: 'selectedVariant.id',
                                            },
                                            payload: {
                                                quantity: 1,
                                                openCart: true,
                                            },
                                        }),
                                    },
                                },
                                {
                                    id: 'pdp_buy_now',
                                    type: 'BuyNowButton',
                                    props: {
                                        text: 'Buy Now',
                                    },
                                    actionMap: {
                                        onClick: migrateActionRef({
                                            actionId: 'BUY_NOW',
                                            payloadBindings: {
                                                variantId: 'selectedVariant.id',
                                            },
                                            payload: {
                                                quantity: 1,
                                            },
                                        }),
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        // Similar products section
        {
            id: 'pdp_similar',
            type: 'Section',
            props: {},
            styleOverrides: {
                base: {
                    padding: '2rem',
                    marginTop: '2rem',
                },
            },
            children: [
                {
                    id: 'similar_heading',
                    type: 'Heading',
                    props: {
                        level: 2,
                        text: 'Similar Products',
                    },
                },
                {
                    id: 'similar_grid',
                    type: 'ProductGrid',
                    props: {
                        columns: 4,
                    },
                    bindingMap: {
                        products: migrateStringBinding('similarProducts'),
                    },
                },
            ],
        },
    ],
};
