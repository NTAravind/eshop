import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as cartService from '@/services/cart/cart.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const tenant = await resolveTenant();
        const { searchParams } = new URL(req.url);

        const start = searchParams.get('start') ? new Date(searchParams.get('start')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
        const end = searchParams.get('end') ? new Date(searchParams.get('end')!) : new Date();

        const analytics = await cartService.getAnalytics(tenant.storeId, start, end);

        return NextResponse.json(analytics);
    } catch (error: any) {
        console.error('Get Cart Analytics Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
