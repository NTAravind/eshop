import * as cartDal from '@/dal/cart.dal';
import * as analyticsDal from '@/dal/cart-analytics.dal';
import { CartEventType } from '@/app/generated/prisma';

export async function getCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    return cartDal.findCart(storeId, query);
}

export async function getOrCreateCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    // If both userId and sessionId are provided, we're in a login scenario and need to merge
    if (query.userId && query.sessionId) {
        // Look for user cart
        const userCart = await cartDal.findCart(storeId, { userId: query.userId });
        // Look for session cart
        const sessionCart = await cartDal.findCart(storeId, { sessionId: query.sessionId });

        // If both exist, merge session cart into user cart
        if (userCart && sessionCart && userCart.id !== sessionCart.id) {
            const mergedCart = await cartDal.mergeSessionCartIntoUserCart(storeId, userCart, sessionCart);
            await analyticsDal.logCartEvent(userCart.id, 'MERGED' as CartEventType, {
                sessionCartId: sessionCart.id
            });
            return mergedCart;
        }

        // If only user cart exists, return it (ignore sessionId from now on)
        if (userCart) {
            return userCart;
        }

        // If only session cart exists, associate it with the user
        if (sessionCart) {
            // Create a new user cart and merge the session cart into it
            const newUserCart = await cartDal.createCart(storeId, { userId: query.userId });
            const mergedCart = await cartDal.mergeSessionCartIntoUserCart(storeId, newUserCart, sessionCart);
            await analyticsDal.logCartEvent(newUserCart.id, 'CREATED' as CartEventType);
            await analyticsDal.logCartEvent(newUserCart.id, 'MERGED' as CartEventType, {
                sessionCartId: sessionCart.id
            });
            return mergedCart;
        }

        // Neither exists, create a user cart
        const cart = await cartDal.createCart(storeId, { userId: query.userId });
        await analyticsDal.logCartEvent(cart.id, 'CREATED' as CartEventType);
        return cart;
    }

    // Standard flow: find or create based on the query
    let cart = await cartDal.findCart(storeId, query);

    if (!cart) {
        if (!query.userId && !query.sessionId) {
            throw new Error('Cannot create cart without userId or sessionId');
        }

        cart = await cartDal.createCart(storeId, {
            userId: query.userId,
            sessionId: query.sessionId,
        });

        // Log creation event
        await analyticsDal.logCartEvent(cart.id, 'CREATED' as CartEventType);
    }

    return cart;
}

export async function addItem(
    storeId: string,
    cartIdQuery: { userId?: string; sessionId?: string; cartId?: string },
    itemStr: { variantId: string; quantity: number }
) {
    // Ensure cart exists
    const cart = await getOrCreateCart(storeId, cartIdQuery);
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

export async function clearCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    const cart = await cartDal.findCart(storeId, query);
    if (!cart) return null;

    // Remove all items from cart
    await cartDal.clearCart(cart.id);

    await analyticsDal.logCartEvent(cart.id, 'CLEARED' as CartEventType);

    return cartDal.findCart(storeId, { cartId: cart.id });
}

export async function getAnalytics(storeId: string, start: Date, end: Date) {
    return analyticsDal.getCartAnalytics(storeId, start, end);
}
