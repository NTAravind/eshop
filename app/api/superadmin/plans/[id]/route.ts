import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * PATCH /api/superadmin/plans/[id]
 * Update plan
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

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name: body.name,
                price: body.price,
                maxStores: body.maxStores,
                maxProducts: body.maxProducts,
                maxOrdersPerMonth: body.maxOrdersPerMonth,
                maxAPIRequestsPerMonth: body.maxAPIRequestsPerMonth,
                isActive: body.isActive,
            },
        });

        return NextResponse.json(plan);
    } catch (error: any) {
        console.error('Update plan error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update plan' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/superadmin/plans/[id]
 * Deactivate plan
 * Requires superadmin role
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json(plan);
    } catch (error: any) {
        console.error('Deactivate plan error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to deactivate plan' },
            { status: 500 }
        );
    }
}
