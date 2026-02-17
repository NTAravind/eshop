import { NextRequest, NextResponse } from 'next/server';
import * as cartService from '@/services/cart/cart.service';
import { getCartIdentity } from '@/services/cart/cart-session';
import { getStoreWithAccount } from '@/services/store.service';
import { mapCartToContext } from '@/modules/storefront/mappers/cart';

export const dynamic = 'force-dynamic';

function resolveStoreId(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    return searchParams.get('storeId') || req.headers.get('x-store-id') || undefined;
}

export async function POST(req: NextRequest) {
    try {
        const storeId = resolveStoreId(req);
        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const { userId, sessionId } = await getCartIdentity();

        const body = await req.json();
        const { variantId, quantity, cartId } = body;

        if (!variantId || !quantity) {
            return NextResponse.json({ error: 'variantId and quantity are required' }, { status: 400 });
        }

        // Pass identification to service to find/create cart
        const cart = await cartService.addItem(
            storeId,
            { userId, sessionId, cartId },
            { variantId, quantity }
        );

        const store = await getStoreWithAccount(storeId);
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }
        const cartContext = cart ? mapCartToContext(cart, store.currency || 'USD') : null;

        return NextResponse.json(cartContext);
    } catch (error: any) {
        console.error('Add Item Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const storeId = resolveStoreId(req);
        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const body = await req.json();
        const { cartId, variantId, quantity } = body;

        if (!cartId || !variantId || typeof quantity !== 'number') {
            return NextResponse.json({ error: 'cartId, variantId, and quantity are required' }, { status: 400 });
        }

        const cart = await cartService.updateItemQuantity(storeId, cartId, variantId, quantity);

        const store = await getStoreWithAccount(storeId);
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }
        const cartContext = cart ? mapCartToContext(cart, store.currency || 'USD') : null;

        return NextResponse.json(cartContext);
    } catch (error: any) {
        console.error('Update Item Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const storeId = resolveStoreId(req);
        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }
        const { searchParams } = new URL(req.url);

        const cartId = searchParams.get('cartId');
        const variantId = searchParams.get('variantId');

        if (!cartId || !variantId) {
            return NextResponse.json({ error: 'cartId and variantId are required' }, { status: 400 });
        }

        const cart = await cartService.removeItem(storeId, cartId, variantId);

        const store = await getStoreWithAccount(storeId);
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }
        const cartContext = cart ? mapCartToContext(cart, store.currency || 'USD') : null;

        return NextResponse.json(cartContext);
    } catch (error: any) {
        console.error('Remove Item Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
