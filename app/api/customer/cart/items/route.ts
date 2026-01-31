import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefront } from '@/lib/tenant/resolveStorefront';
import * as cartService from '@/services/cart/cart.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { storeId, userId, sessionId } = await resolveStorefront();

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

        return NextResponse.json(cart);
    } catch (error: any) {
        console.error('Add Item Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { storeId } = await resolveStorefront();

        const body = await req.json();
        const { cartId, variantId, quantity } = body;

        if (!cartId || !variantId || typeof quantity !== 'number') {
            return NextResponse.json({ error: 'cartId, variantId, and quantity are required' }, { status: 400 });
        }

        const cart = await cartService.updateItemQuantity(storeId, cartId, variantId, quantity);

        return NextResponse.json(cart);
    } catch (error: any) {
        console.error('Update Item Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { storeId } = await resolveStorefront();
        const { searchParams } = new URL(req.url);

        const cartId = searchParams.get('cartId');
        const variantId = searchParams.get('variantId');

        if (!cartId || !variantId) {
            return NextResponse.json({ error: 'cartId and variantId are required' }, { status: 400 });
        }

        const cart = await cartService.removeItem(storeId, cartId, variantId);

        return NextResponse.json(cart);
    } catch (error: any) {
        console.error('Remove Item Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
