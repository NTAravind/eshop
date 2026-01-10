import * as subscriptionDal from '@/dal/subscription.dal';
import { UsageLimitError, ConflictError } from '@/lib/errors';

/**
 * CRITICAL OPTIMIZATION: All usage checks now read from UsageCounter
 * instead of running expensive count() queries.
 * 
 * The counter is kept in sync by increment/decrement operations
 * when resources are created/deleted.
 */

/**
 * Check if account can create a store
 */
export async function checkStoreLimit(accountId: string): Promise<void> {
  const subscription = await subscriptionDal.getSubscriptionByAccountId(accountId);

  if (!subscription) {
    throw new ConflictError('No active subscription');
  }

  if (subscription.status !== 'ACTIVE') {
    throw new ConflictError(`Subscription is ${subscription.status}. Cannot create stores.`);
  }

  const plan = subscription.plan;

  // ENTERPRISE has unlimited stores (NULL check)
  if (plan.maxStores === null) {
    return;
  }

  // Read from UsageCounter instead of counting rows
  const usage = await subscriptionDal.getCurrentUsage(accountId);

  if (usage.storeCount >= plan.maxStores) {
    throw new UsageLimitError(
      `Store limit reached. Your ${plan.name} plan allows ${plan.maxStores} stores.`,
      plan.maxStores,
      usage.storeCount,
      'stores'
    );
  }
}

/**
 * Check if account can create a product
 */
export async function checkProductLimit(accountId: string): Promise<void> {
  const subscription = await subscriptionDal.getSubscriptionByAccountId(accountId);

  if (!subscription) {
    throw new ConflictError('No active subscription');
  }

  if (subscription.status !== 'ACTIVE') {
    throw new ConflictError(`Subscription is ${subscription.status}. Cannot create products.`);
  }

  const plan = subscription.plan;

  // ENTERPRISE has unlimited products
  if (plan.maxProducts === null) {
    return;
  }

  // Read from UsageCounter instead of counting rows
  const usage = await subscriptionDal.getCurrentUsage(accountId);

  if (usage.productCount >= plan.maxProducts) {
    throw new UsageLimitError(
      `Product limit reached. Your ${plan.name} plan allows ${plan.maxProducts} products across all stores.`,
      plan.maxProducts,
      usage.productCount,
      'products'
    );
  }
}

/**
 * Check if account can create an order
 */
export async function checkOrderLimit(accountId: string): Promise<void> {
  return 
}
/**
 * Check if account can add staff
 */
export async function checkStaffLimit(accountId: string): Promise<void> {
  const subscription = await subscriptionDal.getSubscriptionByAccountId(accountId);

  if (!subscription) {
    throw new ConflictError('No active subscription');
  }

  if (subscription.status !== 'ACTIVE') {
    throw new ConflictError(`Subscription is ${subscription.status}. Cannot add staff.`);
  }

  const plan = subscription.plan;

  // ENTERPRISE has unlimited staff
  if (plan.maxStaffMembers === null) {
    return;
  }

  // Read from UsageCounter
  const usage = await subscriptionDal.getCurrentUsage(accountId);

  if (usage.staffCount >= plan.maxStaffMembers) {
    throw new UsageLimitError(
      `Staff limit reached. Your ${plan.name} plan allows ${plan.maxStaffMembers} staff members across all stores.`,
      plan.maxStaffMembers,
      usage.staffCount,
      'staff'
    );
  }
}

/**
 * Check if account can make API request
 */
export async function checkAPIRequestLimit(accountId: string): Promise<void> {
  const subscription = await subscriptionDal.getSubscriptionByAccountId(accountId);

  if (!subscription) {
    throw new ConflictError('No active subscription');
  }

  if (subscription.status !== 'ACTIVE') {
    throw new ConflictError(`Subscription is ${subscription.status}. API access denied.`);
  }

  const plan = subscription.plan;

  // ENTERPRISE has unlimited API requests
  if (plan.maxAPIRequestsPerMonth === null) {
    return;
  }

  // Read from UsageCounter
  const usage = await subscriptionDal.getCurrentUsage(accountId);

  if (usage.apiRequestCount >= plan.maxAPIRequestsPerMonth) {
    throw new UsageLimitError(
      `Monthly API request limit reached. Your ${plan.name} plan allows ${plan.maxAPIRequestsPerMonth} API requests per month.`,
      plan.maxAPIRequestsPerMonth,
      usage.apiRequestCount,
      'api_requests'
    );
  }
}

/**
 * Record store creation
 * Atomically increments the counter
 */
export async function recordStoreCreation(accountId: string): Promise<void> {
  await subscriptionDal.incrementUsage(accountId, 'storeCount');
}

/**
 * Record store deletion
 * Atomically decrements the counter
 */
export async function recordStoreDeletion(accountId: string): Promise<void> {
  await subscriptionDal.decrementUsage(accountId, 'storeCount');
}

/**
 * Record product creation
 * Atomically increments the counter
 */
export async function recordProductCreation(accountId: string): Promise<void> {
  await subscriptionDal.incrementUsage(accountId, 'productCount');
}

/**
 * Record product deletion
 * Atomically decrements the counter
 */
export async function recordProductDeletion(accountId: string): Promise<void> {
  await subscriptionDal.decrementUsage(accountId, 'productCount');
}

/**
 * Record order creation
 * Atomically increments the counter
 */
export async function recordOrderCreation(accountId: string): Promise<void> {
  await subscriptionDal.incrementUsage(accountId, 'orderCount');
}

/**
 * Record staff addition
 * Atomically increments the counter
 */
export async function recordStaffAddition(accountId: string): Promise<void> {
  await subscriptionDal.incrementUsage(accountId, 'staffCount');
}

/**
 * Record staff removal
 * Atomically decrements the counter
 */
export async function recordStaffRemoval(accountId: string): Promise<void> {
  await subscriptionDal.decrementUsage(accountId, 'staffCount');
}

/**
 * Record API request
 * Atomically increments the counter
 */
export async function recordAPIRequest(accountId: string): Promise<void> {
  await subscriptionDal.incrementUsage(accountId, 'apiRequestCount');
}

/**
 * Get usage summary for account
 * Shows current usage against limits
 */
export async function getUsageSummary(accountId: string) {
  const subscription = await subscriptionDal.getSubscriptionByAccountId(accountId);

  if (!subscription) {
    throw new ConflictError('No active subscription');
  }

  const usage = await subscriptionDal.getCurrentUsage(accountId);
  const plan = subscription.plan;

  return {
    plan: {
      name: plan.name,
      type: plan.type,
    },
    period: {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    },
    usage: {
      stores: {
        current: usage.storeCount,
        limit: plan.maxStores,
        percentage: plan.maxStores
          ? Math.round((usage.storeCount / plan.maxStores) * 100)
          : 0,
      },
      products: {
        current: usage.productCount,
        limit: plan.maxProducts,
        percentage: plan.maxProducts
          ? Math.round((usage.productCount / plan.maxProducts) * 100)
          : 0,
      },
      orders: {
        current: usage.orderCount,
        limit: plan.maxOrdersPerMonth,
        percentage: plan.maxOrdersPerMonth
          ? Math.round((usage.orderCount / plan.maxOrdersPerMonth) * 100)
          : 0,
      },
      staff: {
        current: usage.staffCount,
        limit: plan.maxStaffMembers,
        percentage: plan.maxStaffMembers
          ? Math.round((usage.staffCount / plan.maxStaffMembers) * 100)
          : 0,
      },
      apiRequests: {
        current: usage.apiRequestCount,
        limit: plan.maxAPIRequestsPerMonth,
        percentage: plan.maxAPIRequestsPerMonth
          ? Math.round((usage.apiRequestCount / plan.maxAPIRequestsPerMonth) * 100)
          : 0,
      },
    },
  };
}

/**
 * Synchronize usage counters with actual database counts
 * This should be run periodically (e.g., daily cron job) to ensure
 * counters remain accurate despite any edge cases
 */
export async function synchronizeUsageCounters(accountId: string): Promise<void> {
  const [
    actualStores,
    actualProducts,
    actualStaff,
  ] = await Promise.all([
    subscriptionDal.getTotalStoreCount(accountId),
    subscriptionDal.getTotalProductCount(accountId),
    subscriptionDal.getTotalStaffCount(accountId),
  ]);

  const usage = await subscriptionDal.getCurrentUsage(accountId);

  // Calculate deltas
  const storeDelta = actualStores - usage.storeCount;
  const productDelta = actualProducts - usage.productCount;
  const staffDelta = actualStaff - usage.staffCount;

  // Apply corrections if needed
  if (storeDelta !== 0) {
    await subscriptionDal.incrementUsage(accountId, 'storeCount', storeDelta);
  }
  if (productDelta !== 0) {
    await subscriptionDal.incrementUsage(accountId, 'productCount', productDelta);
  }
  if (staffDelta !== 0) {
    await subscriptionDal.incrementUsage(accountId, 'staffCount', staffDelta);
  }
}