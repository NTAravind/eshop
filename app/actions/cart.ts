'use server';

import { cookies } from 'next/headers';
import * as cartService from '@/services/cart/cart.service';
import { auth } from '@/lib/auth';
import { getStoreWithAccount } from '@/services/store.service';
import type { CartContext, CartItemContext } from '@/types/storefront-builder';

const SESSION_COOKIE_NAME = 'cart_session';

async function getSessionId(): Promise<string> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
        return sessionCookie.value;
    }

    // Generate new session ID
    // randomUUID is available in global scope in Node 19+ and Edge Runtime
    // fallback for older node versions if necessary, but Next usually has it.
    const newSessionId = crypto.randomUUID();

    cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
    });

    return newSessionId;
}

export async function getCartAction(storeId: string): Promise<CartContext | null> {
    const session = await auth();
    const userId = session?.user?.id;
    const sessionId = await getSessionId();

    const [store, cart] = await Promise.all([
        getStoreWithAccount(storeId),
        cartService.getOrCreateCart(storeId, { userId, sessionId })
    ]);

    if (!cart || !store) return null;

    // Map items and calculate totals
    let subtotal = 0;
    let itemCount = 0;

    const items: CartItemContext[] = cart.items.map((item: any) => {
        const price = Number(item.variant.price);
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;
        itemCount += item.quantity;

        return {
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            lineTotal,
            product: {
                id: item.variant.product.id,
                name: item.variant.product.name,
                description: item.variant.product.description || undefined,
                images: item.variant.product.images?.map((img: any, i: number) => ({
                    url: img.url,
                    alt: img.altText,
                    position: i
                })) || [],
                variants: [], // Simplified for cart view
                categoryId: item.variant.product.categoryId || undefined,
            },
            variant: {
                id: item.variant.id,
                sku: item.variant.sku,
                price: Number(item.variant.price),
                stock: item.variant.stock,
                customData: item.variant.customData as Record<string, unknown>,
                isActive: item.variant.isActive,
                images: item.variant.images?.map((img: any, i: number) => ({
                    url: img.url,
                    alt: img.altText,
                    position: i
                })) || [],
            },
        };
    });

    return {
        id: cart.id,
        items,
        subtotal,
        total: subtotal, // Add taxes/shipping later
        currency: store.currency || 'USD',
        itemCount,
    };
}
