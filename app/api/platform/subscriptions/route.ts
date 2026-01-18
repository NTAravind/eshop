import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as subscriptionService from '@/services/subscription.service';
import * as subscriptionDal from '@/dal/subscription.dal';

/**
 * GET /api/platform/subscriptions
 * Get current subscription status
 */
export async function GET(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const account = await subscriptionDal.getAccountByUserId(tenant.userId);

        if (!account) {
            return NextResponse.json(
                { error: 'No account found for user' },
                { status: 404 }
            );
        }

        const status = await subscriptionService.getSubscriptionStatus(account.id);

        return NextResponse.json(status);
    } catch (error: any) {
        console.error('Get subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get subscription' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/platform/subscriptions
 * Upgrade subscription to a new plan
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const account = await subscriptionDal.getAccountByUserId(tenant.userId);

        if (!account) {
            return NextResponse.json(
                { error: 'No account found for user' },
                { status: 404 }
            );
        }

        const body = await req.json();

        if (!body.planType) {
            return NextResponse.json(
                { error: 'planType is required' },
                { status: 400 }
            );
        }

        if (!body.paymentProvider) {
            return NextResponse.json(
                { error: 'paymentProvider is required (STRIPE or RAZORPAY)' },
                { status: 400 }
            );
        }

        const result = await subscriptionService.upgradeSubscription(
            tenant.userId,
            account.id,
            body.planType,
            body.paymentProvider
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Upgrade subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upgrade subscription' },
            { status: error.message?.includes('Only') ? 403 : 400 }
        );
    }
}
