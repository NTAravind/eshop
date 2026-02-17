import { NextRequest, NextResponse } from 'next/server';
import * as subscriptionDal from '@/dal/subscription.dal';
import * as usageService from '@/services/usage.service';

/**
 * API Rate Limiter Middleware
 * 
 * Enforces account-wide API request limits based on subscription plan
 * 
 * Usage:
 * import { withAPIRateLimit } from '@/middleware/apiRateLimiter';
 * 
 * export async function GET(req: NextRequest) {
 *   return withAPIRateLimit(req, async (accountId) => {
 *     // Your route logic here
 *     return NextResponse.json({ ... });
 *   });
 * }
 */

export async function withAPIRateLimit(
  req: NextRequest,
  handler: (accountId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract store ID from tenant resolution
    // This assumes you have a resolveTenant() function
    const { resolveTenant } = await import('@/lib/tenant/resolveTenant');
    const tenant = await resolveTenant();

    // Get account from store
    const account = await subscriptionDal.getAccountByStoreId(tenant.storeId);

    if (!account) {
      return NextResponse.json(
        { error: 'Store does not belong to any account' },
        { status: 400 }
      );
    }

    // Check subscription status
    if (!account.subscription || account.subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          error: 'Subscription is not active',
          status: account.subscription?.status || 'NONE'
        },
        { status: 403 }
      );
    }

    // Check API request limit
    try {
      await usageService.checkAPIRequestLimit(account.id);
    } catch (error: any) {
      if (error instanceof usageService.UsageLimitError) {
        return NextResponse.json(
          {
            error: error.message,
            limit: error.limit,
            current: error.current,
            upgradeUrl: '/account/upgrade',
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': error.limit.toString(),
              'X-RateLimit-Remaining': Math.max(0, error.limit - error.current).toString(),
              'X-RateLimit-Reset': account.subscription.currentPeriodEnd.toISOString(),
            },
          }
        );
      }
      throw error;
    }

    // Record API request BEFORE executing handler
    await usageService.recordAPIRequest(account.id);

    // Execute handler
    const response = await handler(account.id);

    // Add usage headers to response
    const usage = await subscriptionDal.getCurrentUsage(account.id);
    const plan = account.subscription.plan;

    if (plan.maxAPIRequestsPerMonth !== null) {
      response.headers.set('X-RateLimit-Limit', plan.maxAPIRequestsPerMonth.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, plan.maxAPIRequestsPerMonth - usage.apiRequestCount).toString());
      response.headers.set('X-RateLimit-Reset', account.subscription.currentPeriodEnd.toISOString());
    }

    return response;
  } catch (error: any) {
    console.error('API rate limit middleware error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Example usage in API route:
 * 
 * // app/api/products/route.ts
 * import { withAPIRateLimit } from '@/middleware/apiRateLimiter';
 * 
 * export async function GET(req: NextRequest) {
 *   return withAPIRateLimit(req, async (accountId) => {
 *     const tenant = await resolveTenant();
 *     const products = await productService.listProducts(tenant.storeId);
 *     return NextResponse.json(products);
 *   });
 * }
 */