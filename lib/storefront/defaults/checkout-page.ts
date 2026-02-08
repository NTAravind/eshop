import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Default checkout page
 */
export const defaultCheckoutPage: StorefrontNode = {
    id: 'page_checkout',
    type: 'Container',
    props: {},
    styles: {
        base: {
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto',
        },
    },
    children: [
        {
            id: 'checkout_header',
            type: 'Heading',
            props: {
                level: 1,
                text: 'Checkout',
            },
            styles: {
                base: {
                    marginBottom: '2rem',
                },
            },
        },
        {
            id: 'checkout_delivery',
            type: 'DeliveryModeSelector',
            props: {},
            bindings: {
                modes: 'settings.deliveryModes',
                selected: 'uiState.deliveryMode',
            },
        },
        {
            id: 'checkout_form',
            type: 'CheckoutForm',
            props: {},
            bindings: {
                fields: 'settings.checkoutFields',
                user: 'user',
                requirePhone: 'store.requirePhoneNumber',
            },
            actions: {
                onSubmit: {
                    actionId: 'SUBMIT_FORM',
                    payload: {
                        formType: 'checkout',
                    },
                },
            },
        },
        {
            id: 'checkout_summary',
            type: 'OrderSummary',
            props: {},
            bindings: {
                items: 'cart.items',
                subtotal: 'cart.subtotal',
                total: 'cart.total',
                currency: 'store.currency',
            },
        },
        {
            id: 'checkout_payment',
            type: 'PaymentMethods',
            props: {},
        },
    ],
};
