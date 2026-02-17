import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/plans
 * List all plans (including inactive)
 * Requires superadmin role
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { price: 'asc' },
            include: {
                _count: {
                    select: { subscriptions: true },
                },
            },
        });

        return NextResponse.json({ plans });
    } catch (error: any) {
        console.error('List plans error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list plans' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/superadmin/plans
 * Create new plan
 * Requires superadmin role
 */
export async function POST(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const body = await req.json();

        if (!body.name || !body.type || body.price === undefined) {
            return NextResponse.json(
                { error: 'name, type, and price are required' },
                { status: 400 }
            );
        }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name: body.name,
                type: body.type,
                price: body.price,
                yearlyPrice: body.yearlyPrice,
                maxStores: body.maxStores,
                maxProducts: body.maxProducts,
                maxOrdersPerMonth: body.maxOrdersPerMonth,
                maxAPIRequestsPerMonth: body.maxAPIRequestsPerMonth,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(plan, { status: 201 });
    } catch (error: any) {
        console.error('Create plan error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create plan' },
            { status: 500 }
        );
    }
}
