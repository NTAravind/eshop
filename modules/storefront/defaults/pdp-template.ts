import type { StorefrontNode } from '@/types/storefront-builder';

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
            styles: {
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
                    styles: {
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
                            bindings: {
                                src: 'selectedVariant.images[0].url',
                                alt: 'product.name',
                            },
                            styles: {
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
                    styles: {
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
                            bindings: {
                                text: 'product.name',
                            },
                        },
                        {
                            id: 'pdp_price',
                            type: 'PriceDisplay',
                            props: {},
                            bindings: {
                                price: 'selectedVariant.price',
                                currency: 'store.currency',
                            },
                        },
                        {
                            id: 'pdp_description',
                            type: 'Text',
                            props: {},
                            bindings: {
                                text: 'product.description',
                            },
                            styles: {
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
                            bindings: {
                                variants: 'product.variants',
                                selected: 'selectedVariant.id',
                            },
                        },
                        {
                            id: 'pdp_actions',
                            type: 'Row',
                            props: {},
                            styles: {
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
                                    actions: {
                                        onClick: {
                                            actionId: 'ADD_TO_CART',
                                            payloadBindings: {
                                                variantId: 'selectedVariant.id',
                                            },
                                            payload: {
                                                quantity: 1,
                                                openCart: true,
                                            },
                                        },
                                    },
                                },
                                {
                                    id: 'pdp_buy_now',
                                    type: 'BuyNowButton',
                                    props: {
                                        text: 'Buy Now',
                                    },
                                    actions: {
                                        onClick: {
                                            actionId: 'BUY_NOW',
                                            payloadBindings: {
                                                variantId: 'selectedVariant.id',
                                            },
                                            payload: {
                                                quantity: 1,
                                            },
                                        },
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
            styles: {
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
                    bindings: {
                        products: 'similarProducts',
                    },
                },
            ],
        },
    ],
};
