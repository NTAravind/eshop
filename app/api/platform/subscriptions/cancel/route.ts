import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as subscriptionService from '@/services/subscription.service';
import * as subscriptionDal from '@/dal/subscription.dal';

/**
 * POST /api/platform/subscriptions/cancel
 * Cancel subscription at period end
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

        const result = await subscriptionService.cancelSubscription(
            tenant.userId,
            account.id
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to cancel subscription' },
            { status: error.message?.includes('Only') ? 403 : 400 }
        );
    }
}
