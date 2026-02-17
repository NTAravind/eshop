import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as subscriptionDal from '@/dal/subscription.dal';
import { requireSuperAdmin } from '@/lib/auth/requireSuperAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/subscriptions
 * List all subscriptions with pagination
 * Requires superadmin role
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const { searchParams } = new URL(req.url);
        const skip = parseInt(searchParams.get('skip') || '0');
        const take = parseInt(searchParams.get('take') || '50');
        const status = searchParams.get('status');

        const where = status ? { status: status as any } : {};

        const [subscriptions, total] = await Promise.all([
            prisma.accountSubscription.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    account: {
                        include: {
                            users: {
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
                            stores: true,
                        },
                    },
                    plan: true,
                },
            }),
            prisma.accountSubscription.count({ where }),
        ]);

        return NextResponse.json({ subscriptions, total });
    } catch (error: any) {
        console.error('List subscriptions error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list subscriptions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/superadmin/subscriptions
 * Create subscription for an account
 * Requires superadmin role
 */
export async function POST(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const body = await req.json();

        if (!body.accountId || !body.planId) {
            return NextResponse.json(
                { error: 'accountId and planId are required' },
                { status: 400 }
            );
        }

        const startDate = body.startDate ? new Date(body.startDate) : new Date();

        const subscription = await subscriptionDal.createSubscription(
            body.accountId,
            body.planId,
            startDate
        );

        return NextResponse.json(subscription, { status: 201 });
    } catch (error: any) {
        console.error('Create subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
