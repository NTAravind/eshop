import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as storeDal from '@/dal/store.dal';
import * as storeStaffDal from '@/dal/storestaff.dal';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ storeId: string }> }
) {
    const params = await context.params;
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        // Verify access
        const staff = await storeStaffDal.getStoreStaff(params.storeId, tenant.userId);
        if (!staff && tenant.storeId !== params.storeId) {
            // Also check if context resolved to this store (e.g. API Key or explicitly passed)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        const overview = await storeDal.getStoreOverview(params.storeId);

        return NextResponse.json(overview);
    } catch (error: any) {
        console.error('Store overview error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch store overview' },
            { status: 500 }
        );
    }
}
