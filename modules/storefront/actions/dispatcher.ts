'use client';

/**
 * Client-side action dispatcher
 * Handles both client-only actions and delegates to server actions
 */

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { ActionRef, ActionPipeline, ActionResult, RuntimeContext, BindingContext } from '@/types/storefront-builder';
import { resolvePayloadBindings } from '../bindings';
import { validatePayload, type RegisteredActionID } from './registry';
import {
    handleAddToCart,
    handleBuyNow,
    handleApplyDiscount,
    handleSubmitForm,
    handleRemoveFromCart,
} from './handlers';

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
            case 'NAVIGATE': {
                let to = validPayload.to as string;
                const replace = validPayload.replace as boolean;

                const slug = (context as any)?.store?.slug;
                if (to && slug && !to.startsWith('http') && !to.startsWith('#')) {
                    if (to.startsWith('/')) {
                        if (!to.startsWith(`/store/${slug}`)) {
                            to = `/store/${slug}${to}`;
                        }
                    } else {
                        to = `/store/${slug}/${to}`;
                    }
                }

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

            case 'OPEN_CART_SIDEBAR':
            case 'opencartsidebar': {
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

            case 'REMOVE_FROM_CART': {
                const result = await handleRemoveFromCart(validPayload as { variantId: string }, { storeId, cartId });
                if (result.success) {
                    onCartUpdate?.();
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

            case 'UPDATE_QUANTITY': {
                // Delegates to cart update flow
                onUIStateChange?.('updateQuantity', validPayload);
                onCartUpdate?.();
                return { success: true, data: validPayload };
            }

            case 'GO_TO_CHECKOUT': {
                const slug = (validPayload.storeSlug as string) || '';
                router.push(slug ? `/${slug}/checkout` : '/checkout');
                return { success: true, data: { navigated: 'checkout' } };
            }

            case 'PLACE_ORDER': {
                return handleSubmitForm(
                    { formType: 'checkout' as const, data: validPayload.checkoutData as Record<string, unknown> | undefined },
                    { storeId, userId }
                );
            }

            case 'SUBMIT_FORM': {
                return handleSubmitForm(
                    validPayload as { formType: 'checkout' | 'login' | 'signup' | 'profile' | 'contact'; data?: Record<string, unknown> },
                    { storeId, userId }
                );
            }

            case 'OAUTH_LOGIN': {
                const provider = validPayload.provider as 'google' | 'instagram';
                const callbackUrl = (validPayload.callbackUrl as string) || '/';
                try {
                    await signIn(provider, { callbackUrl });
                    return { success: true, data: { provider } };
                } catch (error) {
                    return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
                }
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

    /**
     * Dispatch a V2 ActionPipeline (delegates step execution to legacy dispatch).
     */
    async function dispatchPipelineAction(
        pipeline: ActionPipeline,
        context: RuntimeContext | BindingContext
    ): Promise<ActionResult> {
        const { dispatchPipeline: runPipeline } = await import('./pipeline');
        const bindingContext: BindingContext = '__scope' in context
            ? context
            : { ...context } as BindingContext;

        const stepDispatcher: import('./pipeline').StepDispatcher = async (actionId, payload, ctx) => {
            return dispatch({ actionId: actionId as any, payload }, ctx);
        };

        return runPipeline(pipeline, bindingContext, stepDispatcher);
    }

    return { dispatch, createHandler, dispatchPipeline: dispatchPipelineAction };
}
