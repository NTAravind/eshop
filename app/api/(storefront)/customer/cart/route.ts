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

export async function GET(req: NextRequest) {
    try {
        const storeId = resolveStoreId(req);
        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const { userId, sessionId } = await getCartIdentity();
        const { searchParams } = new URL(req.url);
        const cartId = searchParams.get('cartId') || undefined;

        const cart = await cartService.getCart(storeId, { userId, sessionId, cartId });

        if (!cart) {
            return NextResponse.json(null);
        }

        const store = await getStoreWithAccount(storeId);
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }
        const cartContext = mapCartToContext(cart, store.currency || 'USD');

        return NextResponse.json(cartContext);
    } catch (error: any) {
        console.error('Get Cart Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const storeId = resolveStoreId(req);
        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const { userId, sessionId } = await getCartIdentity();

        // Create a new cart explicitly (or get existing)
        const cart = await cartService.getOrCreateCart(storeId, { userId, sessionId });

        const store = await getStoreWithAccount(storeId);
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (!cart) {
            return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
        }

        const cartContext = mapCartToContext(cart as any, store.currency || 'USD');

        return NextResponse.json(cartContext, { status: 201 });
    } catch (error: any) {
        console.error('Create Cart Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
