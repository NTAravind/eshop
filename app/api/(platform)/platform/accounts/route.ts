import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as subscriptionDal from '@/dal/subscription.dal';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

/**
 * GET /api/platform/accounts
 * Get account details
 */
export async function GET(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const account = await subscriptionDal.getAccountByUserId(tenant.userId);

        if (!account) {
            return NextResponse.json(
                { error: 'No account found for user' },
                { status: 404 }
            );
        }

        return NextResponse.json(account);
    } catch (error: any) {
        console.error('Get account error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get account' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/platform/accounts
 * Update account settings
 */
export async function PATCH(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const account = await subscriptionDal.getAccountByUserId(tenant.userId);

        if (!account) {
            return NextResponse.json(
                { error: 'No account found for user' },
                { status: 404 }
            );
        }

        // Verify user is owner - check via AccountUser relation
        const accountUser = await prisma.accountUser.findUnique({
            where: {
                accountId_userId: {
                    accountId: account.id,
                    userId: tenant.userId,
                },
            },
        });

        if (!accountUser || accountUser.role !== 'OWNER') {
            return NextResponse.json(
                { error: 'Only account owners can update account settings' },
                { status: 403 }
            );
        }

        const body = await req.json();

        // BillingAccount only has id, name, createdAt, updatedAt
        // Cannot update name directly - it's managed by the system
        return NextResponse.json(
            { error: 'Account updates not supported' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Update account error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update account' },
            { status: 500 }
        );
    }
}
