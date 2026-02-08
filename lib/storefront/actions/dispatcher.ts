'use client';

/**
 * Client-side action dispatcher
 * Handles both client-only actions and delegates to server actions
 */

import { useRouter } from 'next/navigation';
import type { ActionRef, RuntimeContext, BindingContext } from '@/types/storefront-builder';
import { resolvePayloadBindings } from '../bindings';
import { validatePayload, type RegisteredActionID } from './registry';
import {
    handleAddToCart,
    handleBuyNow,
    handleApplyDiscount,
    handleSubmitForm,
} from './handlers';
import { isServerAction } from './config';

export interface DispatchResult {
    success: boolean;
    data?: unknown;
    error?: string;
}

export interface UseActionDispatcherOptions {
    storeId: string;
    cartId?: string;
    userId?: string;
    onUIStateChange?: (key: string, value: unknown) => void;
    onCartUpdate?: () => void;
}

/**
 * Hook to create an action dispatcher
 */
export function useActionDispatcher(options: UseActionDispatcherOptions) {
    const router = useRouter();
    const { storeId, cartId, userId, onUIStateChange, onCartUpdate } = options;

    /**
     * Dispatch an action
     */
    async function dispatch(
        action: ActionRef,
        context: RuntimeContext | BindingContext
    ): Promise<DispatchResult> {
        const { actionId, payload = {}, payloadBindings } = action;

        // Resolve any payload bindings
        const resolvedPayload = resolvePayloadBindings(payload, payloadBindings, context);

        // Validate the payload
        const validation = validatePayload(actionId, resolvedPayload);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const validPayload = validation.data as Record<string, unknown>;

        // Handle based on action type
        switch (actionId) {
            // Client-only actions
            case 'NAVIGATE': {
                const to = validPayload.to as string;
                const replace = validPayload.replace as boolean;
                if (replace) {
                    router.replace(to);
                } else {
                    router.push(to);
                }
                return { success: true, data: { navigated: to } };
            }

            case 'UPDATE_UI_STATE': {
                const key = validPayload.key as string;
                const value = validPayload.value;
                onUIStateChange?.(key, value);
                return { success: true, data: { key, value } };
            }

            case 'OPEN_CART_SIDEBAR': {
                const open = validPayload.open as boolean;
                onUIStateChange?.('cartSidebarOpen', open);
                return { success: true, data: { cartSidebarOpen: open } };
            }

            case 'SELECT_VARIANT': {
                const variantId = validPayload.variantId as string;
                onUIStateChange?.('selectedVariantId', variantId);
                return { success: true, data: { selectedVariantId: variantId } };
            }

            case 'SET_DELIVERY_MODE': {
                const mode = validPayload.mode as 'DELIVERY' | 'PICKUP';
                onUIStateChange?.('deliveryMode', mode);
                return { success: true, data: { deliveryMode: mode } };
            }

            // Server actions
            case 'ADD_TO_CART': {
                const result = await handleAddToCart(validPayload, { storeId, cartId });
                if (result.success) {
                    onCartUpdate?.();
                    if (validPayload.openCart) {
                        onUIStateChange?.('cartSidebarOpen', true);
                    }
                }
                return result;
            }

            case 'BUY_NOW': {
                const result = await handleBuyNow(validPayload, { storeId, cartId });
                if (result.success) {
                    onCartUpdate?.();
                    const data = result.data as { redirect?: string };
                    if (data?.redirect) {
                        router.push(data.redirect);
                    }
                }
                return result;
            }

            case 'APPLY_DISCOUNT': {
                return handleApplyDiscount(validPayload, { storeId, cartId });
            }

            case 'SUBMIT_FORM': {
                return handleSubmitForm(
                    validPayload as { formType: 'checkout' | 'login' | 'signup' | 'profile' | 'contact'; data?: Record<string, unknown> },
                    { storeId, userId }
                );
            }

            default:
                return { success: false, error: `Unknown action: ${actionId}` };
        }
    }

    /**
     * Create a click handler for an action
     */
    function createHandler(
        action: ActionRef,
        context: RuntimeContext | BindingContext
    ): () => Promise<void> {
        return async () => {
            await dispatch(action, context);
        };
    }

    return { dispatch, createHandler };
}
