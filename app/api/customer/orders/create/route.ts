import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as storeService from '@/services/store.service';

// ... (existing imports)

// (inside try block)
if (!storeId) {
    return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
    );
}

// Fetch store to get currency
const store = await storeService.getStoreWithAccount(storeId);
if (!store) {
    return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
    );
}

if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.postalCode) {
    // ...
}

// Get cart
const cart = await cartService.getCart(storeId, { userId: session.user.id });
if (!cart || cart.items.length === 0) {
    // ...
}

// Convert cart items to order lines
const orderLines = cart.items.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
}));

// Create order
const order = await orderService.createOrder(
    storeId,
    {
        userId: session.user.id,
        lines: orderLines,
        currency: store.currency || 'USD',
    },
    couponCode
);

// TODO: Store shipping/billing address and delivery mode in order metadata
// This would require updating the order schema to include these fields

// Clear cart after successful order
await cartService.clearCart(storeId, { userId: session.user.id });

return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
});
    } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
        { error: error.message || 'Failed to create order' },
        { status: error.status || 500 }
    );
}
}
