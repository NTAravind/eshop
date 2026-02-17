import * as subscriptionDal from '@/dal/subscription.dal';
import { PlanType, SubscriptionStatus } from '@/app/generated/prisma';
import crypto from 'crypto';

/**
 * Create account for user
 */
export async function createAccountForUser(userId: string, name: string) {
  // Check if user already has an account
  const existingAccount = await subscriptionDal.getAccountByUserId(userId);
  if (existingAccount) {
    throw new Error('User already has an account');
  }

  return subscriptionDal.createAccount(name, userId);
}

/**
 * Initialize subscription with FREE plan
 */
export async function initializeFreeSubscription(accountId: string) {
  const freePlan = await subscriptionDal.getPlanByType('FREE');

  if (!freePlan) {
    throw new Error('FREE plan not configured');
  }

  const startDate = new Date();

  return subscriptionDal.createSubscription(accountId, freePlan.id, startDate);
}

/**
 * Upgrade subscription
 */
export async function upgradeSubscription(
  userId: string,
  accountId: string,
  planType: PlanType,
  paymentProvider: 'STRIPE' | 'RAZORPAY'
) {
  // Verify user owns account
  const account = await subscriptionDal.getAccountById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const isOwner = account.users.some(
    u => u.userId === userId && u.role === 'OWNER'
  );
  if (!isOwner) {
    throw new Error('Only account owners can upgrade subscriptions');
  }

  const newPlan = await subscriptionDal.getPlanByType(planType);
  if (!newPlan) {
    throw new Error('Plan not found');
  }

  // Validate against current subscription
  const currentSub = account.subscription;
  if (currentSub && currentSub.plan.price >= newPlan.price) {
    throw new Error('Can only upgrade to higher tier plans');
  }

  // Create invoice
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const invoice = await subscriptionDal.createInvoice(
    accountId,
    newPlan.price,
    now,
    periodEnd
  );

  // In production, trigger payment flow here
  // For now, return invoice details for client-side payment

  return {
    invoice,
    plan: newPlan,
    amount: newPlan.price,
    currency: 'INR',
  };
}

/**
 * Complete subscription upgrade after payment
 */
export async function completeSubscriptionUpgrade(
  accountId: string,
  invoiceId: string,
  paymentId: string
) {
  // Mark invoice as paid
  await subscriptionDal.markInvoicePaid(invoiceId, paymentId);

  // Get invoice to find plan
  const invoice = await subscriptionDal.GetInvoiceById(invoiceId );

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Create or update subscription
  const account = await subscriptionDal.getAccountById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  if (account.subscription) {
    // Upgrade existing subscription
    // Find plan by price (in production, store planId in invoice)
    const plans = await subscriptionDal.listActivePlans();
    const newPlan = plans.find(p => p.price === invoice.amount);

    if (!newPlan) {
      throw new Error('Plan not found for invoice amount');
    }

    return subscriptionDal.changeSubscriptionPlan(accountId, newPlan.id);
  } else {
    // Create new subscription
    const plans = await subscriptionDal.listActivePlans();
    const newPlan = plans.find(p => p.price === invoice.amount);

    if (!newPlan) {
      throw new Error('Plan not found for invoice amount');
    }

    return subscriptionDal.createSubscription(
      accountId,
      newPlan.id,
      invoice.periodStart
    );
  }
}

/**
 * Process subscription renewals (CRON job)
 */
export async function processSubscriptionRenewals() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const expiringSubscriptions = await subscriptionDal.getSubscriptionsExpiringBefore(
    tomorrow
  );

  const results = {
    renewed: 0,
    failed: 0,
    canceled: 0,
  };

  for (const subscription of expiringSubscriptions) {
    try {
      if (subscription.cancelAtPeriodEnd) {
        // Cancel subscription
        await subscriptionDal.updateSubscriptionStatus(
          subscription.accountId,
          'CANCELED'
        );
        results.canceled++;
        continue;
      }

      // Create renewal invoice
      const invoice = await subscriptionDal.createInvoice(
        subscription.accountId,
        subscription.plan.price,
        subscription.currentPeriodEnd,
        new Date(subscription.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000)
      );

      // In production, trigger payment via payment provider
      // For now, simulate successful payment
      const paymentId = `auto_renewal_${crypto.randomBytes(8).toString('hex')}`;

      // Simulate payment processing
      // In real system, use Stripe/Razorpay API

      await subscriptionDal.markInvoicePaid(invoice.id, paymentId);
      await subscriptionDal.renewSubscription(subscription.accountId);

      results.renewed++;
    } catch (error) {
      console.error(
        `Failed to renew subscription for account ${subscription.accountId}:`,
        error
      );

      // Mark as PAST_DUE (give grace period)
      await subscriptionDal.updateSubscriptionStatus(
        subscription.accountId,
        'PAST_DUE'
      );

      results.failed++;
    }
  }

  return results;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string, accountId: string) {
  const account = await subscriptionDal.getAccountById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const isOwner = account.users.some(
    u => u.userId === userId && u.role === 'OWNER'
  );
  if (!isOwner) {
    throw new Error('Only account owners can cancel subscriptions');
  }

  return subscriptionDal.cancelSubscriptionAtPeriodEnd(accountId);
}

/**
 * Get subscription status for account
 */
export async function getSubscriptionStatus(accountId: string) {
  const subscription = await subscriptionDal.getSubscriptionByAccountId(accountId);

  if (!subscription) {
    return {
      hasSubscription: false,
      status: null,
      plan: null,
      currentPeriodEnd: null,
    };
  }

  return {
    hasSubscription: true,
    status: subscription.status,
    plan: subscription.plan,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

/**
 * List available plans
 */
export async function listPlans() {
  return subscriptionDal.listActivePlans();
}