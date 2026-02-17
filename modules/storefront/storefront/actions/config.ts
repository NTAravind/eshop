/**
 * Server action configuration
 * This file contains non-async exports for server actions
 * Separated from handlers.ts because "use server" files can only export async functions
 */

import type { ActionID } from '@/types/storefront-builder';
import {
    handleAddToCart,
    handleApplyDiscount,
    handleBuyNow,
    handleSubmitForm,
} from './handlers';

/**
 * Map of action IDs to their server handlers
 * Client-only actions (NAVIGATE, UPDATE_UI_STATE, etc.) are not included
 */
export const serverActionHandlers = {
    ADD_TO_CART: handleAddToCart,
    BUY_NOW: handleBuyNow,
    APPLY_DISCOUNT: handleApplyDiscount,
    SUBMIT_FORM: handleSubmitForm,
} as const;

export type ServerActionHandlers = typeof serverActionHandlers;
export type ServerActionID = keyof ServerActionHandlers;

/**
 * Check if an action requires server handling
 */
export function isServerAction(actionId: ActionID): boolean {
    return actionId in serverActionHandlers;
}
