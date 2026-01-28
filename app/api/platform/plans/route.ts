import { NextRequest, NextResponse } from 'next/server';
import * as subscriptionService from '@/services/subscription.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/platform/plans
 * List all available subscription plans
 */
export async function GET(req: NextRequest) {
    try {
        const plans = await subscriptionService.listPlans();

        return NextResponse.json({ plans });
    } catch (error: any) {
        console.error('List plans error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list plans' },
            { status: 500 }
        );
    }
}
