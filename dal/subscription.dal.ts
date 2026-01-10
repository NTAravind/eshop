import prisma from '@/lib/prisma';
import { PlanType, SubscriptionStatus, Prisma } from '@/app/generated/prisma';

/**
 * Create billing account
 */
export async function createAccount(name: string, ownerId: string) {
  return prisma.billingAccount.create({
    data: {
      name,
      users: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get account by ID
 */
export async function getAccountById(accountId: string) {
  return prisma.billingAccount.findUnique({
    where: { id: accountId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      stores: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

/**
 * Get account by user ID
 */
export async function getAccountByUserId(userId: string) {
  const accountUser = await prisma.accountUser.findFirst({
    where: { userId },
    include: {
      account: {
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' }, // Primary account
  });

  return accountUser?.account || null;
}

/**
 * Get account by store ID
 */
export async function getAccountByStoreId(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      account: {
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      },
    },
  });

  return store?.account || null;
}

/**
 * Create subscription plan
 */
export async function createPlan(data: {
  type: PlanType;
  name: string;
  description?: string;
  price: number;
  maxStores?: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  maxStaffMembers?: number;
  maxAPIRequestsPerMonth?: number;
}) {
  return prisma.subscriptionPlan.create({
    data,
  });
}

/**
 * Get plan by type
 */
export async function getPlanByType(type: PlanType) {
  return prisma.subscriptionPlan.findUnique({
    where: { type },
  });
}

/**
 * List all active plans
 */
export async function listActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });
}

/**
 * Create subscription for account
 */
export async function createSubscription(
  accountId: string,
  planId: string,
  startDate: Date
) {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  return prisma.accountSubscription.create({
    data: {
      accountId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
    },
    include: {
      plan: true,
      account: true,
    },
  });
}

/**
 * Get subscription by account ID
 */
export async function getSubscriptionByAccountId(accountId: string) {
  return prisma.accountSubscription.findUnique({
    where: { accountId },
    include: {
      plan: true,
      account: true,
    },
  });
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  accountId: string,
  status: SubscriptionStatus
) {
  return prisma.accountSubscription.update({
    where: { accountId },
    data: { status },
  });
}

/**
 * Renew subscription (advance period)
 */
export async function renewSubscription(accountId: string) {
  const subscription = await prisma.accountSubscription.findUnique({
    where: { accountId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const newStart = subscription.currentPeriodEnd;
  const newEnd = new Date(newStart);
  newEnd.setMonth(newEnd.getMonth() + 1);

  return prisma.accountSubscription.update({
    where: { accountId },
    data: {
      currentPeriodStart: newStart,
      currentPeriodEnd: newEnd,
      status: 'ACTIVE',
    },
    include: {
      plan: true,
    },
  });
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(accountId: string) {
  return prisma.accountSubscription.update({
    where: { accountId },
    data: {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    },
  });
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(
  accountId: string,
  newPlanId: string
) {
  return prisma.accountSubscription.update({
    where: { accountId },
    data: {
      planId: newPlanId,
    },
    include: {
      plan: true,
    },
  });
}

/**
 * Get or create usage counter for current period
 */
export async function getOrCreateUsageCounter(accountId: string) {
  const subscription = await getSubscriptionByAccountId(accountId);

  if (!subscription) {
    throw new Error('No active subscription');
  }

  const periodStart = subscription.currentPeriodStart;
  const periodEnd = subscription.currentPeriodEnd;

  // Try to find existing counter
  let counter = await prisma.usageCounter.findUnique({
    where: {
      accountId_periodStart: {
        accountId,
        periodStart,
      },
    },
  });

  if (!counter) {
    // Create new counter for this period
    counter = await prisma.usageCounter.create({
      data: {
        accountId,
        periodStart,
        periodEnd,
      },
    });
  }

  return counter;
}

/**
 * Increment usage counter atomically
 */
export async function incrementUsage(
  accountId: string,
  field: 'storeCount' | 'productCount' | 'orderCount' | 'staffCount' | 'apiRequestCount',
  delta: number = 1
) {
  const counter = await getOrCreateUsageCounter(accountId);

  return prisma.usageCounter.update({
    where: { id: counter.id },
    data: {
      [field]: {
        increment: delta,
      },
    },
  });
}

/**
 * Decrement usage counter atomically
 */
export async function decrementUsage(
  accountId: string,
  field: 'storeCount' | 'productCount' | 'orderCount' | 'staffCount' | 'apiRequestCount',
  delta: number = 1
) {
  const counter = await getOrCreateUsageCounter(accountId);

  return prisma.usageCounter.update({
    where: { id: counter.id },
    data: {
      [field]: {
        decrement: delta,
      },
    },
  });
}

/**
 * Get current usage for account
 */
export async function getCurrentUsage(accountId: string) {
  const counter = await getOrCreateUsageCounter(accountId);
  return counter;
}

/**
 * Get total store count across all time (not just period)
 */
export async function getTotalStoreCount(accountId: string) {
  return prisma.store.count({
    where: { accountId },
  });
}

/**
 * Get total product count across all stores
 */
export async function getTotalProductCount(accountId: string) {
  return prisma.product.count({
    where: {
      store: {
        accountId,
      },
      deletedAt: null,
    },
  });
}

/**
 * Get total staff count across all stores
 */
export async function getTotalStaffCount(accountId: string) {
  return prisma.storeStaff.count({
    where: {
      store: {
        accountId,
      },
    },
  });
}

/**
 * Create invoice
 */
export async function createInvoice(
  accountId: string,
  amount: number,
  periodStart: Date,
  periodEnd: Date
) {
  return prisma.invoice.create({
    data: {
      accountId,
      amount,
      periodStart,
      periodEnd,
      status: 'PENDING',
    },
  });
}

/**
 * Mark invoice as paid
 */
export async function markInvoicePaid(invoiceId: string, paymentId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
      paymentId,
    },
  });
}

/**
 * List subscriptions expiring soon (for renewal processing)
 */
export async function getSubscriptionsExpiringBefore(date: Date) {
  return prisma.accountSubscription.findMany({
    where: {
      currentPeriodEnd: {
        lte: date,
      },
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
    },
    include: {
      plan: true,
      account: true,
    },
  });
}

export async function GetInvoiceById(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
}