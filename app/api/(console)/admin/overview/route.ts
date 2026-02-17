import { NextResponse } from 'next/server';
import { resolveTenant } from '@/server/tenant/resolveTenant';
import * as tenantDal from '@/dal/tenant.dal';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    } catch (error) {
        console.error('Tenant overview error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch tenant overview';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
