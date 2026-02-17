import { NextRequest, NextResponse } from 'next/server';
import * as superadminDal from '@/dal/superadmin.dal';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/overview
 * Get dashboard KPIs and chart data
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();
        const [kpis, ordersChart, apiUsageChart, subscriptionRevenueChart] = await Promise.all([
            superadminDal.getDashboardKPIs(),
            superadminDal.getOrdersTimeSeries(30),
            superadminDal.getAPIUsageTimeSeries(14),
            superadminDal.getSubscriptionRevenueTimeSeries(30),
        ]);

        return NextResponse.json({
            kpis,
            ordersChart,
            apiUsageChart,
            subscriptionRevenueChart,
        });
    } catch (error: any) {
        console.error('Get overview error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get overview data' },
            { status: 500 }
        );
    }
}
