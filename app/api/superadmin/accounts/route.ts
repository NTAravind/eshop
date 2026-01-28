import { NextRequest, NextResponse } from 'next/server';
import * as superadminDal from '@/dal/superadmin.dal';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';
import { PlanType, SubscriptionStatus } from '@/app/generated/prisma';

/**
 * GET /api/superadmin/accounts
 * Get paginated billing accounts with search and filters
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const search = searchParams.get('search') || undefined;
        const planType = searchParams.get('planType') as PlanType | undefined;
        const status = searchParams.get('status') as SubscriptionStatus | undefined;
        const sortBy = (searchParams.get('sortBy') as 'createdAt' | 'name') || 'createdAt';
        const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

        const result = await superadminDal.getBillingAccountsPage({
            page,
            pageSize,
            search,
            planType,
            status,
            sortBy,
            sortOrder,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Get accounts error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get accounts' },
            { status: 500 }
        );
    }
}
