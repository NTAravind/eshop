import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/server/tenant/resolveTenant';
import prisma from '@/server/db/prisma';

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
    } catch (error) {
        console.error('List Carts Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
