import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefront } from '@/lib/tenant/resolveStorefront';
import * as cartService from '@/services/cart/cart.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { storeId, userId, sessionId } = await resolveStorefront();
        const { searchParams } = new URL(req.url);
        const cartId = searchParams.get('cartId') || undefined;

        // Verify context
        if (!userId && !sessionId && !cartId) {
            // If no identification, return empty or create new session? 
            // For GET, we usually expect to fetch an EXISTING cart.
            return NextResponse.json({ message: 'No cart identification provided' }, { status: 400 });
        }

        const cart = await cartService.getCart(storeId, { userId, sessionId, cartId });

        if (!cart) {
            return NextResponse.json(null);
        }

        return NextResponse.json(cart);
    } catch (error: any) {
        console.error('Get Cart Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { storeId, userId, sessionId } = await resolveStorefront();

        // Create a new cart explicitly (or get existing)
        const cart = await cartService.getOrCreateCart(storeId, { userId, sessionId });

        return NextResponse.json(cart, { status: 201 });
    } catch (error: any) {
        console.error('Create Cart Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
