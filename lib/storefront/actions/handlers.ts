'use server';

/**
 * Server action handlers for storefront actions
 * These are called from the action dispatcher on the client
 */

import type { ActionID, RuntimeContext } from '@/types/storefront-builder';
import { addItem } from '@/services/cart/cart.service';

interface HandlerResult {
    success: boolean;
    data?: unknown;
    error?: string;
}

/**
 * Generic handler dispatcher
 * Maps action IDs to their corresponding handlers
 */
export async function handleServerAction(
    actionId: ActionID,
    payload: Record<string, unknown>,
    context: RuntimeContext
): Promise<HandlerResult> {
    switch (actionId) {
        case 'ADD_TO_CART':
            return handleAddToCart(
                payload as { variantId?: string; quantity?: number },
                { storeId: context.store.id, cartId: context.cart?.id }
            );
        case 'BUY_NOW':
            return handleBuyNow(
                payload as { variantId?: string; quantity?: number },
                { storeId: context.store.id, cartId: context.cart?.id }
            );
        case 'PLACE_ORDER':
            return handlePlaceOrder(payload as Record<string, string>, context);
        default:
            return { success: false, error: `Unknown action: ${actionId}` };
    }
}

/**
 * Handler for PLACE_ORDER action
 */
export async function handlePlaceOrder(
    payload: Record<string, string>,
    context: RuntimeContext
): Promise<HandlerResult> {
    try {
        // Get form data from DOM
        if (typeof document === 'undefined') {
            return { success: false, error: 'Cannot access form - running on server' };
        }

        const formElement = document.getElementById('checkout-form') as HTMLFormElement;
        if (!formElement) {
            return { success: false, error: 'Checkout form not found' };
        }

        const formData = new FormData(formElement);

        const orderData = {
            storeId: context.store.id,
            shippingAddress: {
                street: formData.get('shippingStreet') as string,
                city: formData.get('shippingCity') as string,
                state: formData.get('shippingState') as string,
                postalCode: formData.get('shippingPostal') as string,
                country: formData.get('shippingCountry') as string,
            },
            billingAddress: {
                street: formData.get('shippingStreet') as string,
                city: formData.get('shippingCity') as string,
                state: formData.get('shippingState') as string,
                postalCode: formData.get('shippingPostal') as string,
                country: formData.get('shippingCountry') as string,
            },
            deliveryMode: context.uiState.deliveryMode || 'DELIVERY',
            paymentMethod: 'COD',
            couponCode: payload.couponCode,
        };

        // Call customer order API
        const response = await fetch('/api/customer/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to create order' };
        }

        const result = await response.json();

        // Redirect to order confirmation
        if (typeof window !== 'undefined') {
            window.location.href = `/store/${context.store.slug}/orders/${result.orderId}`;
        }

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to place order',
        };
    }
}

import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'cart_session';

async function getSessionContext() {
    const session = await auth();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    let sessionId = sessionCookie?.value;

    // If no session cookie and no user, generate one
    if (!sessionId && !session?.user?.id) {
        sessionId = crypto.randomUUID();
        cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            sameSite: 'lax',
        });
    }

    return {
        userId: session?.user?.id,
        sessionId,
    };
}

/**
 * Handler for ADD_TO_CART action
 */
export async function handleAddToCart(
    payload: { variantId?: string; quantity?: number },
    context: { storeId: string; cartId?: string }
): Promise<HandlerResult> {
    try {
        if (!payload.variantId) {
            return { success: false, error: 'Variant ID is required' };
        }

        const sessionContext = await getSessionContext();

        // If we have a cartId in context (from client), use it as hint
        // But authoritative identity comes from sessionContext
        const query = {
            cartId: context.cartId,
            userId: sessionContext.userId,
            sessionId: sessionContext.sessionId,
        };

        const result = await addItem(
            context.storeId,
            query,
            {
                variantId: payload.variantId,
                quantity: payload.quantity ?? 1,
            }
        );

        return { success: true, data: result };
    } catch (error) {
        console.error('Add to cart error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add to cart',
        };
    }
}

/**
 * Handler for BUY_NOW action (add to cart then navigate to checkout)
 */
export async function handleBuyNow(
    payload: { variantId?: string; quantity?: number },
    context: { storeId: string; cartId?: string }
): Promise<HandlerResult> {
    // First add to cart
    const addResult = await handleAddToCart(payload, context);
    if (!addResult.success) {
        return addResult;
    }

    // Return with redirect instruction
    return {
        success: true,
        data: {
            ...(addResult.data as Record<string, unknown>),
            redirect: '/checkout',
        },
    };
}

/**
 * Handler for APPLY_DISCOUNT action
 */
export async function handleApplyDiscount(
    payload: { code?: string },
    context: { storeId: string; cartId?: string }
): Promise<HandlerResult> {
    // TODO: Implement discount application
    // This would validate the discount code and apply it to the cart
    if (!payload.code) {
        return { success: false, error: 'Discount code is required' };
    }

    return {
        success: true,
        data: { applied: true, code: payload.code },
    };
}

/**
 * Handler for SUBMIT_FORM action
 */
export async function handleSubmitForm(
    payload: {
        formType: 'checkout' | 'login' | 'signup' | 'profile' | 'contact';
        data?: Record<string, unknown>;
    },
    context: { storeId: string; userId?: string }
): Promise<HandlerResult> {
    // Form handling is done via specific form components
    // This is a placeholder for custom form submissions
    return {
        success: true,
        data: { formType: payload.formType, submitted: true },
    };
}

