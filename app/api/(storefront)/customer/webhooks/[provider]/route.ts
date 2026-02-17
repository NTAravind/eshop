import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { handleStripeWebhook } from '@/lib/payments/stripe';
import { handleRazorpayWebhook } from '@/lib/payments/razorpay';

/**
 * POST /api/webhooks/stripe
 * POST /api/webhooks/razorpay
 * 
 * Handle payment provider webhooks
 * Note: Webhook URLs must include storeId in query params
 * Example: /api/webhooks/stripe?storeId=store_123
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const params = await context.params;
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId query parameter is required' },
        { status: 400 }
      );
    }

    const provider = params.provider.toLowerCase();

    switch (provider) {
      case 'stripe': {
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
          return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
          );
        }

        const body = await req.text();

        const result = await handleStripeWebhook(storeId, body, signature);
        return NextResponse.json(result);
      }

      case 'razorpay': {
        const headersList = await headers();
        const signature = headersList.get('x-razorpay-signature');

        if (!signature) {
          return NextResponse.json(
            { error: 'Missing x-razorpay-signature header' },
            { status: 400 }
          );
        }

        const body = await req.json();

        const result = await handleRazorpayWebhook(storeId, body, signature);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported payment provider' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error(`Webhook error (${params.provider}):`, error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

/**
 * Webhook URL Setup:
 * 
 * Stripe:
 * - URL: https://your-domain.com/api/webhooks/stripe?storeId=store_123
 * - Events to listen: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
 * 
 * Razorpay:
 * - URL: https://your-domain.com/api/webhooks/razorpay?storeId=store_123
 * - Events to listen: payment.captured, payment.failed
 * 
 * IMPORTANT: Each store must have its own webhook URL with unique storeId
 */