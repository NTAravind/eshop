import * as cartDal from '@/dal/cart.dal';
import * as analyticsDal from '@/dal/cart-analytics.dal';
import { CartEventType } from '@/app/generated/prisma';

export async function getCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    return cartDal.findCart(storeId, query);
}

export async function getOrCreateCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    let cart = await cartDal.findCart(storeId, query);

    if (!cart) {
        if (!query.userId && !query.sessionId) {
            throw new Error('Cannot create cart without userId or sessionId');
        }

        // Check if there's an existing cart for this user/session to avoid duplicates race conditions (handled by db constraints mostly)
        // But since findCart uses findFirst with multiple conditions, if we only provide one, we are good.
        // If we have both, we might want to merge, but for now let's assume one is primary.

        cart = await cartDal.createCart(storeId, {
            userId: query.userId,
            sessionId: query.sessionId,
        });

        // Log creation event
        await analyticsDal.logCartEvent(cart.id, 'CREATED');
    }

    return cart;
}

export async function addItem(
    storeId: string,
    cartIdQuery: { userId?: string; sessionId?: string; cartId?: string },
    itemStr: { variantId: string; quantity: number }
) {
    // Ensure cart exists
    let cart = await getOrCreateCart(storeId, cartIdQuery);
    if (!cart) throw new Error('Failed to retrieve cart'); // Should not happen

    // Add item
    const updatedItem = await cartDal.addItemToCart(storeId, cart.id, itemStr);

    // Log event
    await analyticsDal.logCartEvent(cart.id, 'ITEM_ADDED', {
        variantId: itemStr.variantId,
        quantity: itemStr.quantity
    });

    // Return updated cart
    return cartDal.findCart(storeId, { cartId: cart.id });
}

export async function updateItemQuantity(
    storeId: string,
    cartId: string,
    variantId: string,
    quantity: number
) {
    const updatedItem = await cartDal.updateCartItem(storeId, cartId, variantId, quantity);

    await analyticsDal.logCartEvent(cartId, 'ITEM_UPDATED', {
        variantId,
        quantity
    });

    return cartDal.findCart(storeId, { cartId });
}

export async function removeItem(storeId: string, cartId: string, variantId: string) {
    await cartDal.removeItemFromCart(storeId, cartId, variantId);

    await analyticsDal.logCartEvent(cartId, 'ITEM_REMOVED', {
        variantId
    });

    return cartDal.findCart(storeId, { cartId });
}

export async function getAnalytics(storeId: string, start: Date, end: Date) {
    return analyticsDal.getCartAnalytics(storeId, start, end);
}
