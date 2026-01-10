import prisma from '@/lib/prisma';
import { PaymentProvider, PaymentStatus } from '@/app/generated/prisma';

/**
 * Create payment record with idempotency
 */
export async function createPayment(
  storeId: string,
  orderId: string,
  data: {
    provider: PaymentProvider;
    amount: number;
    currency?: string;
    idempotencyKey?: string;
    providerPaymentId?: string;
  }
) {
  // Check for existing payment with same idempotency key
  if (data.idempotencyKey) {
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.payment.create({
    data: {
      storeId,
      orderId,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency || 'INR',
      idempotencyKey: data.idempotencyKey,
      providerPaymentId: data.providerPaymentId,
    },
  });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  storeId: string,
  paymentId: string,
  status: PaymentStatus,
  providerPaymentId?: string
) {
  return prisma.payment.update({
    where: {
      id: paymentId,
      storeId,
    },
    data: {
      status,
      ...(providerPaymentId && { providerPaymentId }),
    },
  });
}

/**
 * Get payment by ID
 */
export async function getPaymentById(storeId: string, paymentId: string) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      storeId,
    },
    include: {
      order: true,
    },
  });
}

/**
 * Get payment by provider payment ID
 */
export async function getPaymentByProviderId(
  storeId: string,
  providerPaymentId: string
) {
  return prisma.payment.findFirst({
    where: {
      storeId,
      providerPaymentId,
    },
    include: {
      order: true,
    },
  });
}

/**
 * List payments with filters
 */
export async function listPayments(
  storeId: string,
  filters?: {
    orderId?: string;
    status?: PaymentStatus;
    provider?: PaymentProvider;
    skip?: number;
    take?: number;
  }
) {
  const where: any = {
    storeId,
    ...(filters?.orderId && { orderId: filters.orderId }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.provider && { provider: filters.provider }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 50,
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total };
}