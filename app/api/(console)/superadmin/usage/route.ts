import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/usage
 * List usage counters with pagination
 * Requires superadmin role
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const { searchParams } = new URL(req.url);
        const skip = parseInt(searchParams.get('skip') || '0');
        const take = parseInt(searchParams.get('take') || '50');
        const search = searchParams.get('search') || '';

        const where: any = {};

        if (search) {
            where.account = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { id: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [usage, total] = await Promise.all([
            prisma.usageCounter.findMany({
                where,
                skip,
                take,
                orderBy: { periodEnd: 'desc' },
                include: {
                    account: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.usageCounter.count({ where }),
        ]);

        return NextResponse.json({ usage, total });
    } catch (error: any) {
        console.error('List usage error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list usage' },
            { status: 500 }
        );
    }
}
