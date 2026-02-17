import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as tenantDal from '@/dal/tenant.dal';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        const overview = await tenantDal.getTenantOverview(tenant.userId);

        if (!overview) {
            return NextResponse.json(
                { error: 'Tenant account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(overview);
    } catch (error: any) {
        console.error('Tenant overview error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch tenant overview' },
            { status: 500 }
        );
    }
}
