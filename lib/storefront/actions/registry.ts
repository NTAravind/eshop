import { z } from 'zod';
import type { ActionID } from '@/types/storefront-builder';

/**
 * Action definitions with payload schemas
 */
export const actionRegistry = {
    ADD_TO_CART: {
        displayName: 'Add to Cart',
        description: 'Add a product variant to the shopping cart',
        payloadSchema: z.object({
            variantId: z.string().optional(),
            quantity: z.number().default(1),
            openCart: z.boolean().default(true),
        }),
        bindablePayload: ['variantId'] as const,
    },

    BUY_NOW: {
        displayName: 'Buy Now',
        description: 'Add item and go directly to checkout',
        payloadSchema: z.object({
            variantId: z.string().optional(),
            quantity: z.number().default(1),
        }),
        bindablePayload: ['variantId'] as const,
    },

    SELECT_VARIANT: {
        displayName: 'Select Variant',
        description: 'Select a product variant',
        payloadSchema: z.object({
            variantId: z.string(),
        }),
        bindablePayload: ['variantId'] as const,
    },

    APPLY_DISCOUNT: {
        displayName: 'Apply Discount',
        description: 'Apply a discount code to the cart',
        payloadSchema: z.object({
            code: z.string().optional(),
        }),
        bindablePayload: ['code'] as const,
    },

    SET_DELIVERY_MODE: {
        displayName: 'Set Delivery Mode',
        description: 'Toggle between delivery and pickup',
        payloadSchema: z.object({
            mode: z.enum(['DELIVERY', 'PICKUP']),
        }),
        bindablePayload: [] as const,
    },

    OPEN_CART_SIDEBAR: {
        displayName: 'Open Cart Sidebar',
        description: 'Toggle the cart sidebar visibility',
        payloadSchema: z.object({
            open: z.boolean().default(true),
        }),
        bindablePayload: [] as const,
    },

    NAVIGATE: {
        displayName: 'Navigate',
        description: 'Navigate to a different page',
        payloadSchema: z.object({
            to: z.string(),
            params: z.record(z.string(), z.string()).optional(),
            replace: z.boolean().default(false),
        }),
        bindablePayload: ['to'] as const,
    },

    UPDATE_UI_STATE: {
        displayName: 'Update UI State',
        description: 'Update client-side UI state',
        payloadSchema: z.object({
            key: z.string(),
            value: z.unknown(),
        }),
        bindablePayload: ['value'] as const,
    },

    SUBMIT_FORM: {
        displayName: 'Submit Form',
        description: 'Submit a form (checkout, login, etc.)',
        payloadSchema: z.object({
            formType: z.enum(['checkout', 'login', 'signup', 'profile', 'contact']),
            data: z.record(z.string(), z.unknown()).optional(),
        }),
        bindablePayload: ['data'] as const,
    },
} as const;

export type ActionRegistry = typeof actionRegistry;
export type RegisteredActionID = keyof ActionRegistry;

/**
 * Get action definition by ID
 */
export function getActionDefinition(actionId: ActionID) {
    return actionRegistry[actionId as RegisteredActionID];
}

/**
 * Validate action payload
 */
export function validatePayload(
    actionId: ActionID,
    payload: unknown
): { valid: boolean; data?: unknown; error?: string } {
    const definition = getActionDefinition(actionId);
    if (!definition) {
        return { valid: false, error: `Unknown action: ${actionId}` };
    }

    try {
        const data = definition.payloadSchema.parse(payload);
        return { valid: true, data };
    } catch (err) {
        if (err instanceof z.ZodError) {
            return { valid: false, error: err.issues.map((e: z.ZodIssue) => e.message).join(', ') };
        }
        return { valid: false, error: 'Invalid payload' };
    }
}

/**
 * Get all action IDs
 */
export function getActionIds(): RegisteredActionID[] {
    return Object.keys(actionRegistry) as RegisteredActionID[];
}

/**
 * Get actions grouped for UI display
 */
export function getActionsForUI(): Array<{
    id: RegisteredActionID;
    displayName: string;
    description: string;
}> {
    return getActionIds().map(id => ({
        id,
        displayName: actionRegistry[id].displayName,
        description: actionRegistry[id].description,
    }));
}
