import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as subscriptionDal from '@/dal/subscription.dal';
import prisma from '@/lib/prisma';

/**
 * GET /api/platform/invoices
 * List invoices for account
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

        const invoices = await prisma.invoice.findMany({
            where: {
                accountId: account.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ invoices });
    } catch (error: any) {
        console.error('List invoices error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list invoices' },
            { status: 500 }
        );
    }
}
