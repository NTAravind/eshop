import { migrateStringBinding } from '../../binding-ast';
import { migrateActionRef } from '../../actions/pipeline';
import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Cart item card — refreshed UI/UX with clear hierarchy and correct bindings.
 */
export const cartItemCardPrefab: StorefrontNode = {
    id: 'CartItemCard_default',
    type: 'Container',
    props: {},
    styleOverrides: {
        base: {
            display: 'grid',
            gridTemplateColumns: '104px 1fr 110px',
            gap: '1rem',
            padding: '1rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 14px 38px rgba(0,0,0,0.08)',
            alignItems: 'center',
        },
        hover: {
            boxShadow: '0 18px 44px rgba(0,0,0,0.12)',
        },
    },
    children: [
        // Image
        {
            id: 'cart_item_image_wrapper',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: {
                    width: '104px',
                    height: '104px',
                    borderRadius: '0.8rem',
                    overflow: 'hidden',
                    backgroundColor: 'var(--muted)',
                },
            },
            children: [
                {
                    id: 'cart_item_image',
                    type: 'Image',
                    props: { alt: 'Product' },
                    bindingMap: {
                        src: {
                            kind: 'fallback',
                            primary: migrateStringBinding('item.variant.images[0].url'),
                            fallback: {
                                kind: 'fallback',
                                primary: migrateStringBinding('item.product.images[0].url'),
                                fallback: migrateStringBinding('item.product.image')
                            }
                        },
                        alt: {
                            kind: 'fallback',
                            primary: migrateStringBinding('item.product.name'),
                            fallback: { kind: 'literal', value: 'Cart item' }
                        }
                    },
                    styleOverrides: {
                        base: {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        },
                    },
                },
            ],
        },

        // Middle: texts + quantity
        {
            id: 'cart_item_content',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    minWidth: 0,
                },
            },
            children: [
                {
                    id: 'cart_item_header',
                    type: 'Container',
                    props: {},
                    styleOverrides: {
                        base: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                        },
                    },
                    children: [
                        {
                            id: 'cart_item_texts',
                            type: 'Container',
                            props: {},
                            styleOverrides: {
                                base: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.15rem',
                                    minWidth: 0,
                                },
                            },
                            children: [
                                {
                                    id: 'cart_item_name',
                                    type: 'Text',
                                    props: {},
                                    bindingMap: {
                                        text: {
                                            kind: 'fallback',
                                            primary: migrateStringBinding('item.product.name'),
                                            fallback: { kind: 'literal', value: 'Untitled item' }
                                        },
                                    },
                                    styleOverrides: {
                                        base: {
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            lineHeight: 1.3,
                                            color: 'var(--foreground)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                    },
                                },
                                {
                                    id: 'cart_item_variant',
                                    type: 'Text',
                                    props: {},
                                    bindingMap: {
                                        text: {
                                            kind: 'fallback',
                                            primary: migrateStringBinding('item.variant.sku'),
                                            fallback: {
                                                kind: 'fallback',
                                                primary: migrateStringBinding('item.variant.name'),
                                                fallback: migrateStringBinding('item.variantId')
                                            }
                                        }
                                    },
                                    styleOverrides: {
                                        base: {
                                            fontSize: '0.85rem',
                                            color: 'var(--muted-foreground)',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            id: 'cart_item_remove_btn',
                            type: 'Button',
                            props: {
                                variant: 'ghost',
                                size: 'icon',
                                text: 'Remove',
                            },
                            actionMap: {
                                onClick: migrateActionRef({
                                    actionId: 'REMOVE_FROM_CART',
                                    payloadBindings: {
                                        variantId: 'item.variantId',
                                    },
                                }),
                            },
                            styleOverrides: {
                                base: {
                                    height: '32px',
                                    width: '32px',
                                    color: 'var(--muted-foreground)',
                                },
                                hover: {
                                    color: 'var(--destructive)',
                                },
                            },
                            children: [
                                { id: 'remove_icon', type: 'Icon', props: { name: 'Trash2', size: 16 } },
                            ],
                        },
                    ],
                },

                {
                    id: 'cart_item_meta',
                    type: 'Container',
                    props: {},
                    styleOverrides: {
                        base: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                        },
                    },
                    children: [
                        {
                            id: 'cart_item_quantity',
                            type: 'QuantitySelector',
                            props: {},
                            bindingMap: {
                                value: migrateStringBinding('item.quantity'),
                                itemId: migrateStringBinding('item.id'),
                            },
                            actionMap: {
                                onChange: migrateActionRef({
                                    actionId: 'UPDATE_QUANTITY',
                                    payloadBindings: {
                                        variantId: 'item.variantId',
                                        quantity: '$event',
                                    },
                                }),
                            },
                        }
                    ],
                },
            ],
        },

        // Right: line total for layout balance
        {
            id: 'cart_item_price_side',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.4rem',
                },
            },
            children: [
                {
                    id: 'cart_item_price_side_value',
                    type: 'PriceDisplay',
                    props: {},
                    bindingMap: {
                        price: migrateStringBinding('item.lineTotal'),
                        currency: migrateStringBinding('store.currency'),
                    },
                    styleOverrides: {
                        base: {
                            fontWeight: 750,
                            fontSize: '1.05rem',
                        },
                    },
                },
            ],
        },
    ],
};
