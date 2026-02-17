import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/users
 * List all users with pagination
 * Requires superadmin role
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const { searchParams } = new URL(req.url);
        const skip = parseInt(searchParams.get('skip') || '0');
        const take = parseInt(searchParams.get('take') || '50');
        const search = searchParams.get('search') || '';

        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { name: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    ownedAccounts: {
                        include: {
                            account: {
                                include: {
                                    subscription: {
                                        include: {
                                            plan: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({ users, total });
    } catch (error: any) {
        console.error('List users error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list users' },
            { status: 500 }
        );
    }
}
