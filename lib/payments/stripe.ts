import Stripe from 'stripe';
import * as paymentConfigDal from '@/dal/paymentConfig.dal';
import * as paymentDal from '@/dal/payment.dal';
import * as orderDal from '@/dal/order.dal';

/**
 * Get Stripe client for a specific store
 */
async function getStripeClient(storeId: string): Promise<Stripe> {
  const credentials = await paymentConfigDal.getPaymentCredentials(
    storeId,
    'STRIPE'
  );

  return new Stripe(credentials.apiKey, {
    apiVersion: '2023-10-16' as any,
    typescript: true,
  });
}

/**
 * Create Stripe payment intent
 */
export async function createStripePaymentIntent(
  storeId: string,
  orderId: string,
  amount: number,
  currency: string = 'inr'
) {
  const stripe = await getStripeClient(storeId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount, // Amount in smallest currency unit (paise for INR)
    currency,
    metadata: {
      storeId,
      orderId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Create payment record in database
  const payment = await paymentDal.createPayment(storeId, orderId, {
    provider: 'STRIPE',
    amount,
    currency: currency.toUpperCase(),
  });

  return {
    paymentId: payment.id,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Confirm Stripe payment
 */
export async function confirmStripePayment(
  storeId: string,
  paymentIntentId: string
) {
  const stripe = await getStripeClient(storeId);

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    // Update payment status in database
    const orderId = paymentIntent.metadata.orderId;

    // Find payment by orderId
    const payments = await paymentDal.listPayments(storeId, {
      orderId,
      provider: 'STRIPE',
    });

    if (payments.payments.length > 0) {
      const payment = payments.payments[0];
      await paymentDal.updatePaymentStatus(storeId, payment.id, 'COMPLETED');
      await orderDal.updateOrderStatus(storeId, orderId, 'PAID');
    }

    return { success: true, status: 'succeeded' };
  }

  return { success: false, status: paymentIntent.status };
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  storeId: string,
  body: string | Buffer,
  signature: string
) {
  const credentials = await paymentConfigDal.getPaymentCredentials(
    storeId,
    'STRIPE'
  );

  if (!credentials.webhookSecret) {
    throw new Error('Webhook secret not configured');
  }

  const stripe = await getStripeClient(storeId);

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    credentials.webhookSecret
  );

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        // Find payment
        const payments = await paymentDal.listPayments(storeId, {
          orderId,
          provider: 'STRIPE',
        });

        if (payments.payments.length > 0) {
          const payment = payments.payments[0];
          await paymentDal.updatePaymentStatus(storeId, payment.id, 'COMPLETED');
          await orderDal.updateOrderStatus(storeId, orderId, 'PAID');
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const payments = await paymentDal.listPayments(storeId, {
          orderId,
          provider: 'STRIPE',
        });

        if (payments.payments.length > 0) {
          const payment = payments.payments[0];
          await paymentDal.updatePaymentStatus(storeId, payment.id, 'FAILED');
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      // Handle refund logic here
      console.log('Charge refunded:', charge.id);
      break;
    }
  }

  return { received: true };
}

/**
 * Create Stripe refund
 */
export async function createStripeRefund(
  storeId: string,
  paymentIntentId: string,
  amount?: number
) {
  const stripe = await getStripeClient(storeId);

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // Optional: partial refund
  });

  return {
    refundId: refund.id,
    amount: refund.amount,
    status: refund.status,
  };
}