import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/analytics
 * Get platform-wide analytics
 * Requires superadmin role
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const [
            totalUsers,
            totalStores,
            totalOrders,
            totalRevenue,
            activeSubscriptions,
            subscriptionsByPlan,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.store.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: 'PAID' },
            }),
            prisma.accountSubscription.count({
                where: { status: 'ACTIVE' },
            }),
            prisma.accountSubscription.groupBy({
                by: ['planId'],
                _count: true,
                where: { status: 'ACTIVE' },
            }),
        ]);

        // Get plan details for subscription breakdown
        const plans = await prisma.subscriptionPlan.findMany();
        const subscriptionBreakdown = subscriptionsByPlan.map((sub) => {
            const plan = plans.find((p) => p.id === sub.planId);
            return {
                planName: plan?.name || 'Unknown',
                planType: plan?.type || 'Unknown',
                count: sub._count,
            };
        });

        return NextResponse.json({
            totalUsers,
            totalStores,
            totalOrders,
            totalRevenue: totalRevenue._sum.total || 0,
            activeSubscriptions,
            subscriptionBreakdown,
        });
    } catch (error: any) {
        console.error('Get analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get analytics' },
            { status: 500 }
        );
    }
}
