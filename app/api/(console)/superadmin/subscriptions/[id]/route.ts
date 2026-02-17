import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as subscriptionDal from '@/dal/subscription.dal';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/superadmin/subscriptions/[id]
 * Update subscription
 * Requires superadmin role
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireSuperAdmin();

        const body = await req.json();

        // Find subscription by account ID
        const subscription = await prisma.accountSubscription.findUnique({
            where: { accountId: id },
        });

        if (!subscription) {
            return NextResponse.json(
                { error: 'Subscription not found' },
                { status: 404 }
            );
        }

        if (body.planId) {
            // Change plan
            const updated = await subscriptionDal.changeSubscriptionPlan(id, body.planId);
            return NextResponse.json(updated);
        }

        if (body.status) {
            // Update status
            const updated = await subscriptionDal.updateSubscriptionStatus(id, body.status);
            return NextResponse.json(updated);
        }

        return NextResponse.json(
            { error: 'No valid update fields provided' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Update subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update subscription' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/superadmin/subscriptions/[id]
 * Cancel subscription
 * Requires superadmin role
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireSuperAdmin();

        await subscriptionDal.updateSubscriptionStatus(id, 'CANCELED');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
