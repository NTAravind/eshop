import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import { confirmStripePayment } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';
import { captureRazorpayPayment } from '@/lib/payments/razorpay';

/**
 * POST /api/payments/verify
 * Verify and capture payment
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();
    const body = await req.json();

    if (!body.provider) {
      return NextResponse.json(
        { error: 'provider is required' },
        { status: 400 }
      );
    }

    const provider = body.provider.toUpperCase();

    switch (provider) {
      case 'STRIPE': {
        if (!body.paymentIntentId) {
          return NextResponse.json(
            { error: 'paymentIntentId is required for Stripe' },
            { status: 400 }
          );
        }

        const result = await confirmStripePayment(
          tenant.storeId,
          body.paymentIntentId
        );

        return NextResponse.json(result);
      }

      case 'RAZORPAY': {
        if (!body.orderId || !body.razorpayPaymentId || !body.razorpayOrderId || !body.razorpaySignature) {
          return NextResponse.json(
            { error: 'orderId, razorpayPaymentId, razorpayOrderId, and razorpaySignature are required for Razorpay' },
            { status: 400 }
          );
        }

        const result = await captureRazorpayPayment(
          tenant.storeId,
          body.orderId,
          body.razorpayPaymentId,
          body.razorpayOrderId,
          body.razorpaySignature
        );

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported payment provider' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 400 }
    );
  }
}

/**
 * Example Request (Stripe):
 * {
 *   "provider": "STRIPE",
 *   "paymentIntentId": "pi_xxx"
 * }
 * 
 * Example Response (Stripe):
 * {
 *   "success": true,
 *   "status": "succeeded"
 * }
 * 
 * Example Request (Razorpay):
 * {
 *   "provider": "RAZORPAY",
 *   "orderId": "order_abc123",
 *   "razorpayPaymentId": "pay_xxx",
 *   "razorpayOrderId": "order_xxx",
 *   "razorpaySignature": "abc123..."
 * }
 * 
 * Example Response (Razorpay):
 * {
 *   "success": true,
 *   "status": "captured"
 * }
 */