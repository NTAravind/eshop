import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/superadmin/stores/[id]
 * Get store details
 * Requires superadmin role
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        const store = await prisma.store.findUnique({
            where: { id },
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
                        user: true,
                    },
                },
                products: {
                    take: 10,
                },
            },
        });

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(store);
    } catch (error: any) {
        console.error('Get store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get store' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/superadmin/stores/[id]
 * Update store
 * Requires superadmin role
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        const body = await req.json();

        const store = await prisma.store.update({
            where: { id },
            data: {
                name: body.name,
                slug: body.slug,
            },
        });

        return NextResponse.json(store);
    } catch (error: any) {
        console.error('Update store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update store' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/superadmin/stores/[id]
 * Delete store
 * Requires superadmin role
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        await prisma.store.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete store' },
            { status: 500 }
        );
    }
}
