import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/server/tenant/resolveTenant';
import * as customerDal from '@/dal/customer.dal';
import * as storeStaffDal from '@/dal/storestaff.dal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json(
                { error: 'Store ID is required' },
                { status: 400 }
            );
        }

        // Verify access
        const staff = await storeStaffDal.getStoreStaff(storeId, tenant.userId);
        if (!staff) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        const filters = {
            search: searchParams.get('search') || undefined,
            skip: parseInt(searchParams.get('skip') || '0'),
            take: parseInt(searchParams.get('take') || '50'),
        };

        const result = await customerDal.listStoreCustomers(storeId, filters);

        return NextResponse.json(result);
    } catch (error) {
        console.error('List customers error:', error);
        const message = error instanceof Error ? error.message : 'Failed to list customers';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
