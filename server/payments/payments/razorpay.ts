import Razorpay from 'razorpay';
import crypto from 'crypto';
import * as paymentConfigDal from '@/dal/paymentConfig.dal';
import * as paymentDal from '@/dal/payment.dal';
import * as orderDal from '@/dal/order.dal';

/**
 * Get Razorpay client for a specific store
 */
async function getRazorpayClient(storeId: string): Promise<Razorpay> {
  const credentials = await paymentConfigDal.getPaymentCredentials(
    storeId,
    'RAZORPAY'
  );

  if (!credentials.apiSecret) {
    throw new Error('Razorpay API secret not configured');
  }

  return new Razorpay({
    key_id: credentials.apiKey,
    key_secret: credentials.apiSecret,
  });
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(
  storeId: string,
  orderId: string,
  amount: number,
  currency: string = 'INR'
) {
  const razorpay = await getRazorpayClient(storeId);

  const razorpayOrder = await razorpay.orders.create({
    amount, // Amount in paise
    currency,
    receipt: orderId,
    notes: {
      storeId,
      orderId,
    },
  });

  // Create payment record in database
  const payment = await paymentDal.createPayment(storeId, orderId, {
    provider: 'RAZORPAY',
    amount,
    currency,
  });

  return {
    paymentId: payment.id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
}

/**
 * Verify Razorpay payment signature
 */
export async function verifyRazorpaySignature(
  storeId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const credentials = await paymentConfigDal.getPaymentCredentials(
    storeId,
    'RAZORPAY'
  );

  if (!credentials.apiSecret) {
    throw new Error('Razorpay API secret not configured');
  }

  const body = razorpayOrderId + '|' + razorpayPaymentId;

  const expectedSignature = crypto
    .createHmac('sha256', credentials.apiSecret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

/**
 * Capture Razorpay payment
 */
export async function captureRazorpayPayment(
  storeId: string,
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
) {
  // Verify signature
  const isValid = await verifyRazorpaySignature(
    storeId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    throw new Error('Invalid payment signature');
  }

  const razorpay = await getRazorpayClient(storeId);

  // Fetch payment details
  const payment = await razorpay.payments.fetch(razorpayPaymentId);

  if (payment.status === 'captured' || payment.status === 'authorized') {
    // Update payment in database
    const payments = await paymentDal.listPayments(storeId, {
      orderId,
      provider: 'RAZORPAY',
    });

    if (payments.payments.length > 0) {
      const dbPayment = payments.payments[0];
      await paymentDal.updatePaymentStatus(storeId, dbPayment.id, 'COMPLETED');
      await orderDal.updateOrderStatus(storeId, orderId, 'PAID');
    }

    return { success: true, status: payment.status };
  }

  return { success: false, status: payment.status };
}

/**
 * Handle Razorpay webhook
 */
export async function handleRazorpayWebhook(
  storeId: string,
  body: any,
  signature: string
) {
  const credentials = await paymentConfigDal.getPaymentCredentials(
    storeId,
    'RAZORPAY'
  );

  if (!credentials.webhookSecret) {
    throw new Error('Webhook secret not configured');
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', credentials.webhookSecret)
    .update(JSON.stringify(body))
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid webhook signature');
  }

  const event = body.event;
  const payload = body.payload.payment.entity;

  switch (event) {
    case 'payment.captured': {
      const orderId = payload.notes?.orderId;

      if (orderId) {
        const payments = await paymentDal.listPayments(storeId, {
          orderId,
          provider: 'RAZORPAY',
        });

        if (payments.payments.length > 0) {
          const payment = payments.payments[0];
          await paymentDal.updatePaymentStatus(storeId, payment.id, 'COMPLETED');
          await orderDal.updateOrderStatus(storeId, orderId, 'PAID');
        }
      }
      break;
    }

    case 'payment.failed': {
      const orderId = payload.notes?.orderId;

      if (orderId) {
        const payments = await paymentDal.listPayments(storeId, {
          orderId,
          provider: 'RAZORPAY',
        });

        if (payments.payments.length > 0) {
          const payment = payments.payments[0];
          await paymentDal.updatePaymentStatus(storeId, payment.id, 'FAILED');
        }
      }
      break;
    }
  }

  return { received: true };
}

/**
 * Create Razorpay refund
 */
export async function createRazorpayRefund(
  storeId: string,
  razorpayPaymentId: string,
  amount?: number
) {
  const razorpay = await getRazorpayClient(storeId);

  const refund = await razorpay.payments.refund(razorpayPaymentId, {
    amount, // Optional: partial refund in paise
  });

  return {
    refundId: refund.id,
    amount: refund.amount,
    status: refund.status,
  };
}