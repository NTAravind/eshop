import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/stores
 * List all stores with pagination
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
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { slug: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [stores, total] = await Promise.all([
            prisma.store.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
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
                    staff: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.store.count({ where }),
        ]);

        return NextResponse.json({ stores, total });
    } catch (error: any) {
        console.error('List stores error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list stores' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/superadmin/stores
 * Create store (superadmin can create for any account)
 * Requires superadmin role
 */
export async function POST(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const body = await req.json();

        if (!body.accountId || !body.name || !body.slug) {
            return NextResponse.json(
                { error: 'accountId, name, and slug are required' },
                { status: 400 }
            );
        }

        const store = await prisma.store.create({
            data: {
                accountId: body.accountId,
                name: body.name,
                slug: body.slug,
            },
        });

        return NextResponse.json(store, { status: 201 });
    } catch (error: any) {
        console.error('Create store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create store' },
            { status: 500 }
        );
    }
}
