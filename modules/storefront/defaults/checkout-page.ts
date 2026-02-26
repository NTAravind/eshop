import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';
import { migrateActionRef } from '../actions/pipeline';
import { cartItemCardPrefab } from './prefabs/cart-item-card';

/**
 * Default checkout page built with editable primitive nodes
 */
export const defaultCheckoutPage: StorefrontNode = {
    id: 'page_checkout',
    type: 'Container',
    props: {},
    styleOverrides: {
        base: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'start',
        },
        sm: {
            gridTemplateColumns: '1fr',
        }
    },
    children: [
        // LEFT COLUMN: Forms and Delivery/Payment
        {
            id: 'checkout_left_col',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: { display: 'flex', flexDirection: 'column', gap: '2rem' }
            },
            children: [
                {
                    id: 'checkout_header',
                    type: 'Heading',
                    props: { level: 1, text: 'Checkout' },
                },

                // Delivery Mode Selection as Editable Buttons
                {
                    id: 'delivery_mode_selector',
                    type: 'Container',
                    props: {},
                    styleOverrides: {
                        base: { display: 'flex', gap: '1rem' }
                    },
                    children: [
                        {
                            id: 'btn_delivery',
                            type: 'Container',
                            props: {},
                            actionMap: {
                                onClick: {
                                    id: 'act_set_delivery',
                                    steps: [{ id: 'step_set_delivery', actionId: 'SET_DELIVERY_MODE', payload: { mode: 'DELIVERY' } }]
                                }
                            },
                            styleOverrides: {
                                base: {
                                    flex: 1, padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--card)'
                                },
                                hover: { backgroundColor: 'var(--muted)' }
                            },
                            children: [{ id: 'text_delivery', type: 'Text', props: { text: '🚚 Delivery' }, styleOverrides: { base: { fontWeight: '500' } } }]
                        },
                        {
                            id: 'btn_pickup',
                            type: 'Container',
                            props: {},
                            actionMap: {
                                onClick: {
                                    id: 'act_set_pickup',
                                    steps: [{ id: 'step_set_pickup', actionId: 'SET_DELIVERY_MODE', payload: { mode: 'PICKUP' } }]
                                }
                            },
                            styleOverrides: {
                                base: {
                                    flex: 1, padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--card)'
                                },
                                hover: { backgroundColor: 'var(--muted)' }
                            },
                            children: [{ id: 'text_pickup', type: 'Text', props: { text: '🏪 Pickup' }, styleOverrides: { base: { fontWeight: '500' } } }]
                        }
                    ]
                },

                // Explicit Checkout Form Structure
                {
                    id: 'checkout_form',
                    type: 'CheckoutForm',
                    props: {},
                    actionMap: {
                        onSubmit: {
                            id: 'act_submit_checkout',
                            steps: [
                                {
                                    id: 'step_submit_checkout',
                                    actionId: 'SUBMIT_FORM',
                                    payload: { formType: 'checkout' },
                                }
                            ]
                        }
                    },
                    styleOverrides: {
                        base: { display: 'flex', flexDirection: 'column', gap: '2rem' },
                    },
                    children: [
                        // Contact Section
                        {
                            id: 'contact_section',
                            type: 'Container',
                            props: {},
                            styleOverrides: { base: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
                            children: [
                                { id: 'contact_header', type: 'Heading', props: { level: 3, text: 'Contact Information' } },
                                {
                                    id: 'contact_grid',
                                    type: 'Container',
                                    props: {},
                                    styleOverrides: { base: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' } },
                                    children: [
                                        {
                                            id: 'field_name_col', type: 'Container', props: {},
                                            children: [
                                                { id: 'label_name', type: 'ProfileLabel', props: { text: 'Full Name *' } },
                                                { id: 'input_name', type: 'ProfileInput', props: { fieldName: 'fullName', required: true } }
                                            ]
                                        },
                                        {
                                            id: 'field_email_col', type: 'Container', props: {},
                                            children: [
                                                { id: 'label_email', type: 'ProfileLabel', props: { text: 'Email *' } },
                                                { id: 'input_email', type: 'ProfileInput', props: { type: 'email', fieldName: 'email', required: true } }
                                            ]
                                        },
                                        {
                                            id: 'field_phone_col', type: 'Container', props: {},
                                            styleOverrides: { base: { gridColumn: '1 / -1' } },
                                            children: [
                                                { id: 'label_phone', type: 'ProfileLabel', props: { text: 'Phone Number' } },
                                                { id: 'input_phone', type: 'ProfileInput', props: { type: 'tel', fieldName: 'phone' } }
                                            ]
                                        },
                                    ]
                                }
                            ]
                        },

                        // Shipping Section
                        {
                            id: 'shipping_section',
                            type: 'Container',
                            props: {},
                            styleOverrides: { base: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
                            children: [
                                { id: 'shipping_header', type: 'Heading', props: { level: 3, text: 'Shipping Address' } },
                                {
                                    id: 'field_street_col', type: 'Container', props: {},
                                    children: [
                                        { id: 'label_street', type: 'ProfileLabel', props: { text: 'Street Address *' } },
                                        { id: 'input_street', type: 'ProfileInput', props: { fieldName: 'shippingStreet', required: true } }
                                    ]
                                },
                                {
                                    id: 'shipping_grid_2',
                                    type: 'Container',
                                    props: {},
                                    styleOverrides: { base: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' } },
                                    children: [
                                        {
                                            id: 'field_city_col', type: 'Container', props: {},
                                            children: [
                                                { id: 'label_city', type: 'ProfileLabel', props: { text: 'City *' } },
                                                { id: 'input_city', type: 'ProfileInput', props: { fieldName: 'shippingCity', required: true } }
                                            ]
                                        },
                                        {
                                            id: 'field_state_col', type: 'Container', props: {},
                                            children: [
                                                { id: 'label_state', type: 'ProfileLabel', props: { text: 'State/Province *' } },
                                                { id: 'input_state', type: 'ProfileInput', props: { fieldName: 'shippingState', required: true } }
                                            ]
                                        },
                                        {
                                            id: 'field_postal_col', type: 'Container', props: {},
                                            children: [
                                                { id: 'label_postal', type: 'ProfileLabel', props: { text: 'Postal Code *' } },
                                                { id: 'input_postal', type: 'ProfileInput', props: { fieldName: 'shippingPostal', required: true } }
                                            ]
                                        },
                                        {
                                            id: 'field_country_col', type: 'Container', props: {},
                                            children: [
                                                { id: 'label_country', type: 'ProfileLabel', props: { text: 'Country *' } },
                                                { id: 'input_country', type: 'ProfileInput', props: { fieldName: 'shippingCountry', required: true } }
                                            ]
                                        },
                                    ]
                                }
                            ]
                        },

                        // Payment Methods as Buttons
                        {
                            id: 'payment_section',
                            type: 'Container',
                            props: {},
                            styleOverrides: { base: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
                            children: [
                                { id: 'payment_header', type: 'Heading', props: { level: 3, text: 'Payment Method' } },
                                {
                                    id: 'payment_options_row',
                                    type: 'Container',
                                    props: {},
                                    styleOverrides: { base: { display: 'flex', gap: '1rem' } },
                                    children: [
                                        {
                                            id: 'cond_razorpay',
                                            type: 'Conditional',
                                            props: {},
                                            bindingMap: { show: { kind: 'path', root: 'store', segments: ['paymentMethods', 'RAZORPAY'] } },
                                            children: [
                                                {
                                                    id: 'btn_razorpay',
                                                    type: 'Container',
                                                    props: {},
                                                    styleOverrides: {
                                                        base: {
                                                            flex: 1, padding: '1rem', border: '2px solid var(--primary)', borderRadius: 'var(--radius)',
                                                            backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'
                                                        }
                                                    },
                                                    actionMap: {
                                                        onClick: {
                                                            id: 'act_sel_razorpay',
                                                            steps: [{ id: 'step_sel_razorpay', actionId: 'SET_UI_STATE', payload: { key: 'paymentMethod', value: 'RAZORPAY' } }]
                                                        }
                                                    },
                                                    children: [
                                                        { id: 'img_razorpay', type: 'Icon', props: { name: 'CreditCard' }, styleOverrides: { base: { color: 'var(--primary)' } } },
                                                        { id: 'text_razorpay', type: 'Text', props: { text: 'Razorpay' }, styleOverrides: { base: { fontWeight: '500' } } }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            id: 'cond_stripe',
                                            type: 'Conditional',
                                            props: {},
                                            bindingMap: { show: { kind: 'path', root: 'store', segments: ['paymentMethods', 'STRIPE'] } },
                                            children: [
                                                {
                                                    id: 'btn_stripe',
                                                    type: 'Container',
                                                    props: {},
                                                    styleOverrides: {
                                                        base: {
                                                            flex: 1, padding: '1rem', border: '2px solid var(--primary)', borderRadius: 'var(--radius)',
                                                            backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'
                                                        }
                                                    },
                                                    actionMap: {
                                                        onClick: {
                                                            id: 'act_sel_stripe',
                                                            steps: [{ id: 'step_sel_stripe', actionId: 'SET_UI_STATE', payload: { key: 'paymentMethod', value: 'STRIPE' } }]
                                                        }
                                                    },
                                                    children: [
                                                        { id: 'img_stripe', type: 'Icon', props: { name: 'CreditCard' }, styleOverrides: { base: { color: 'var(--primary)' } } },
                                                        { id: 'text_stripe', type: 'Text', props: { text: 'Stripe' }, styleOverrides: { base: { fontWeight: '500' } } }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            id: 'cond_manual',
                                            type: 'Conditional',
                                            props: {},
                                            bindingMap: { show: { kind: 'path', root: 'store', segments: ['paymentMethods', 'MANUAL'] } },
                                            children: [
                                                {
                                                    id: 'btn_cod',
                                                    type: 'Container',
                                                    props: {},
                                                    styleOverrides: {
                                                        base: {
                                                            flex: 1, padding: '1rem', border: '2px solid var(--primary)', borderRadius: 'var(--radius)',
                                                            backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'
                                                        }
                                                    },
                                                    actionMap: {
                                                        onClick: {
                                                            id: 'act_sel_manual',
                                                            steps: [{ id: 'step_sel_manual', actionId: 'SET_UI_STATE', payload: { key: 'paymentMethod', value: 'MANUAL' } }]
                                                        }
                                                    },
                                                    children: [
                                                        { id: 'img_cod', type: 'Icon', props: { name: 'Banknote' }, styleOverrides: { base: { color: 'var(--primary)' } } },
                                                        { id: 'text_cod', type: 'Text', props: { text: 'Cash on Delivery' }, styleOverrides: { base: { fontWeight: '500' } } }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },

                        // Submit Button
                        {
                            id: 'submit_checkout_btn',
                            type: 'ProfileSubmitButton',
                            props: {},
                            styleOverrides: {
                                base: {
                                    backgroundColor: 'var(--primary)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer'
                                }
                            },
                            children: [
                                {
                                    id: 'submit_checkout_text',
                                    type: 'Text',
                                    props: { text: '🛒 Place Order' },
                                    styleOverrides: {
                                        base: {
                                            color: 'var(--primary-foreground)',
                                            fontWeight: '600'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },

        // RIGHT COLUMN: Order Summary with cart repeater
        {
            id: 'checkout_right_col',
            type: 'Container',
            props: {},
            styleOverrides: {
                base: {
                    padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--card)',
                    position: 'sticky', top: '2rem'
                }
            },
            children: [
                { id: 'summary_heading', type: 'Heading', props: { level: 3, text: 'Order Summary' } },
                {
                    id: 'cart_items_repeater',
                    type: 'Repeater',
                    props: {},
                    bindingMap: {
                        items: migrateStringBinding('cart.items'),
                    },
                    children: [
                        { ...cartItemCardPrefab, id: 'checkout_cart_item' }
                    ]
                },
                {
                    id: 'summary_totals',
                    type: 'Container',
                    props: {},
                    styleOverrides: { base: { display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' } },
                    children: [
                        {
                            id: 'subtotal_row', type: 'Container', props: {}, styleOverrides: { base: { display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' } },
                            children: [
                                { id: 'lbl_subtotal', type: 'Text', props: { text: 'Subtotal' } },
                                { id: 'val_subtotal', type: 'PriceDisplay', props: {}, bindingMap: { price: migrateStringBinding('cart.subtotal'), currency: migrateStringBinding('store.currency') } }
                            ]
                        },
                        {
                            id: 'total_row', type: 'Container', props: {}, styleOverrides: { base: { display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.25rem', marginTop: '0.5rem' } },
                            children: [
                                { id: 'lbl_total', type: 'Text', props: { text: 'Total' } },
                                { id: 'val_total', type: 'PriceDisplay', props: {}, bindingMap: { price: migrateStringBinding('cart.total'), currency: migrateStringBinding('store.currency') } }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
};
