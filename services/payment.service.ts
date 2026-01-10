import * as paymentDal from '@/dal/payment.dal';
import * as orderDal from '@/dal/order.dal';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { PaymentProvider, PaymentStatus } from '@/app/generated/prisma';

export async function createPayment(
  userId: string,
  storeId: string,
  orderId: string,
  input: {
    provider: PaymentProvider;
    amount: number;
    currency?: string;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (input.amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  if (!Number.isInteger(input.amount)) {
    throw new Error('Payment amount must be in smallest currency unit');
  }

  // Verify order exists and belongs to store
  const order = await orderDal.getOrderById(storeId, orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  // Business rule: Can't create payment for cancelled order
  if (order.status === 'CANCELLED') {
    throw new Error('Cannot create payment for cancelled order');
  }

  return paymentDal.createPayment(storeId, orderId, {
    provider: input.provider,
    amount: input.amount,
    currency: input.currency,
  });
}

export async function updatePaymentStatus(
  userId: string,
  storeId: string,
  paymentId: string,
  status: PaymentStatus
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Get payment to check current status
  const payment = await paymentDal.getPaymentById(storeId, paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Business rules for status transitions
  if (payment.status === 'COMPLETED') {
    throw new Error('Cannot change status of completed payment');
  }

  // Update payment status
  const updatedPayment = await paymentDal.updatePaymentStatus(
    storeId,
    paymentId,
    status
  );

  // If payment completed, update order status
  if (status === 'COMPLETED') {
    await orderDal.updateOrderStatus(storeId, payment.orderId, 'PAID');
  }

  return updatedPayment;
}

export async function getPayment(
  userId: string,
  storeId: string,
  paymentId: string
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'SUPPORT');

  return paymentDal.getPaymentById(storeId, paymentId);
}

export async function listPayments(
  userId: string,
  storeId: string,
  filters?: {
    orderId?: string;
    status?: PaymentStatus;
    provider?: PaymentProvider;
    skip?: number;
    take?: number;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'SUPPORT');

  // Validation
  const take = filters?.take ?? 50;
  if (take > 100) {
    throw new Error('Maximum 100 items per page');
  }

  return paymentDal.listPayments(storeId, {
    ...filters,
    take,
  });
}