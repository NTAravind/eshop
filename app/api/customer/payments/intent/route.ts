import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as orderDal from '@/dal/order.dal';

export const dynamic = 'force-dynamic';
import { createStripePaymentIntent } from '@/lib/payments/stripe';
import { createRazorpayOrder } from '@/lib/payments/razorpay';

/**
 * POST /api/payments/intent
 * Create a payment intent for an order
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();
    const body = await req.json();

    if (!body.orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    if (!body.provider) {
      return NextResponse.json(
        { error: 'provider is required (STRIPE, RAZORPAY, or MANUAL)' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await orderDal.getOrderById(tenant.storeId, body.orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status === 'PAID') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Order is cancelled' },
        { status: 400 }
      );
    }

    const provider = body.provider.toUpperCase();
    const currency = body.currency || 'INR';

    switch (provider) {
      case 'STRIPE': {
        const result = await createStripePaymentIntent(
          tenant.storeId,
          body.orderId,
          order.total,
          currency.toLowerCase()
        );
        return NextResponse.json({
          provider: 'STRIPE',
          ...result,
        });
      }

      case 'RAZORPAY': {
        const result = await createRazorpayOrder(
          tenant.storeId,
          body.orderId,
          order.total,
          currency.toUpperCase()
        );
        return NextResponse.json({
          provider: 'RAZORPAY',
          ...result,
        });
      }

      case 'MANUAL': {
        // Manual payments don't need payment intents
        return NextResponse.json({
          provider: 'MANUAL',
          message: 'Manual payment selected. Complete payment offline and update status.',
          orderId: body.orderId,
          amount: order.total,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported payment provider' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 400 }
    );
  }
}

/**
 * Example Request (Stripe):
 * {
 *   "orderId": "order_abc123",
 *   "provider": "STRIPE",
 *   "currency": "INR"
 * }
 * 
 * Example Response (Stripe):
 * {
 *   "provider": "STRIPE",
 *   "paymentId": "pay_xyz789",
 *   "clientSecret": "pi_xxx_secret_yyy",
 *   "paymentIntentId": "pi_xxx"
 * }
 * 
 * Example Request (Razorpay):
 * {
 *   "orderId": "order_abc123",
 *   "provider": "RAZORPAY",
 *   "currency": "INR"
 * }
 * 
 * Example Response (Razorpay):
 * {
 *   "provider": "RAZORPAY",
 *   "paymentId": "pay_xyz789",
 *   "razorpayOrderId": "order_xxx",
 *   "amount": 14999,
 *   "currency": "INR"
 * }
 * 
 * Client-side Integration:
 * 
 * // Stripe
 * const stripe = await loadStripe('pk_test_...');
 * const { error } = await stripe.confirmPayment({
 *   clientSecret,
 *   confirmParams: {
 *     return_url: 'https://your-app.com/order/success',
 *   },
 * });
 * 
 * // Razorpay
 * const options = {
 *   key: 'rzp_test_...',
 *   amount: response.amount,
 *   currency: response.currency,
 *   order_id: response.razorpayOrderId,
 *   handler: function (response) {
 *     // Send to /api/payments/verify
 *   },
 * };
 * const rzp = new Razorpay(options);
 * rzp.open();
 */