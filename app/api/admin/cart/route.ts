import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Optional: List active carts (mostly for support/debugging)
export async function GET(req: NextRequest) {
    try {
        const tenant = await resolveTenant();
        const { searchParams } = new URL(req.url);
        const take = parseInt(searchParams.get('take') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const carts = await prisma.cart.findMany({
            where: { storeId: tenant.storeId },
            include: {
                items: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take,
            skip
        });

        const total = await prisma.cart.count({ where: { storeId: tenant.storeId } });

        return NextResponse.json({ carts, total });
    } catch (error: any) {
        console.error('List Carts Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
