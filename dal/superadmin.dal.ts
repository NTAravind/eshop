import prisma from '@/lib/prisma';
import { PlanType, SubscriptionStatus, OrderStatus, PaymentStatus } from '@/app/generated/prisma';

/**
 * Super Admin Dashboard Data Access Layer
 * Aggregates metrics across all billing accounts, stores, and orders
 */

// ==========================================
// DASHBOARD KPIs
// ==========================================

export interface DashboardKPIs {
    totalBillingAccounts: number;
    activeSubscriptionsByPlan: {
        FREE: number;
        BASIC: number;
        PRO: number;
        ENTERPRISE: number;
    };
    totalStores: number;
    ordersLast30Days: number;
    revenueLast30Days: number;
    subscriptionRevenueLast30Days: number;
    failedPaymentsLast30Days: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all queries in parallel for performance
    const [
        totalBillingAccounts,
        subscriptionsByPlan,
        totalStores,
        ordersLast30Days,
        revenueLast30Days,
        subscriptionRevenueLast30Days,
        failedPaymentsLast30Days,
    ] = await Promise.all([
        // Total billing accounts
        prisma.billingAccount.count(),

        // Active subscriptions grouped by plan type
        prisma.accountSubscription.groupBy({
            by: ['planId'],
            where: {
                status: SubscriptionStatus.ACTIVE,
            },
            _count: true,
        }),

        // Total stores across all accounts
        prisma.store.count(),

        // Orders in last 30 days
        prisma.order.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
        }),

        // Revenue from paid orders in last 30 days
        prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
                status: OrderStatus.PAID,
            },
            _sum: {
                total: true,
            },
        }),

        // Revenue from paid invoices in last 30 days (Subscription Revenue)
        prisma.invoice.aggregate({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
                status: PaymentStatus.COMPLETED,
            },
            _sum: {
                amount: true,
            },
        }),

        // Failed payments in last 30 days
        prisma.payment.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
                status: PaymentStatus.FAILED,
            },
        }),
    ]);

    // Get plan details to map planId to planType
    const plans = await prisma.subscriptionPlan.findMany({
        select: {
            id: true,
            type: true,
        },
    });

    const planIdToType = new Map(plans.map(p => [p.id, p.type]));

    // Initialize counts for all plan types
    const activeSubscriptionsByPlan = {
        FREE: 0,
        BASIC: 0,
        PRO: 0,
        ENTERPRISE: 0,
    };

    // Populate counts from grouped results
    subscriptionsByPlan.forEach(group => {
        const planType = planIdToType.get(group.planId);
        if (planType && planType in activeSubscriptionsByPlan) {
            activeSubscriptionsByPlan[planType as PlanType] = group._count;
        }
    });

    return {
        totalBillingAccounts,
        activeSubscriptionsByPlan,
        totalStores,
        ordersLast30Days,
        revenueLast30Days: revenueLast30Days._sum.total || 0,
        subscriptionRevenueLast30Days: subscriptionRevenueLast30Days._sum.amount || 0,
        failedPaymentsLast30Days,
    };
}

// ==========================================
// TIME SERIES DATA FOR CHARTS
// ==========================================

export interface TimeSeriesDataPoint {
    date: string; // ISO date string (YYYY-MM-DD)
    value: number;
}

export async function getOrdersTimeSeries(days: number = 30): Promise<TimeSeriesDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
            createdAt: {
                gte: startDate,
            },
        },
        _count: true,
    });

    // Group by date (ignore time)
    const dateMap = new Map<string, number>();

    orders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + order._count);
    });

    // Fill in missing dates with 0
    const result: TimeSeriesDataPoint[] = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];

        result.push({
            date: dateKey,
            value: dateMap.get(dateKey) || 0,
        });
    }

    return result;
}

export async function getAPIUsageTimeSeries(days: number = 14): Promise<TimeSeriesDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get usage counters that overlap with our date range
    const usageCounters = await prisma.usageCounter.findMany({
        where: {
            OR: [
                {
                    periodStart: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                {
                    periodEnd: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                {
                    AND: [
                        {
                            periodStart: {
                                lte: startDate,
                            },
                        },
                        {
                            periodEnd: {
                                gte: endDate,
                            },
                        },
                    ],
                },
            ],
        },
        select: {
            periodStart: true,
            periodEnd: true,
            apiRequestCount: true,
        },
    });

    // Aggregate API usage by day
    // Note: This is a simplified aggregation. In production, you'd want
    // more granular tracking or daily snapshots
    const dateMap = new Map<string, number>();

    usageCounters.forEach(counter => {
        const dateKey = counter.periodStart.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + counter.apiRequestCount);
    });

    // Fill in missing dates with 0
    const result: TimeSeriesDataPoint[] = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];

        result.push({
            date: dateKey,
            value: dateMap.get(dateKey) || 0,
        });
    }

    return result;
}

export async function getSubscriptionRevenueTimeSeries(days: number = 30): Promise<TimeSeriesDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.groupBy({
        by: ['createdAt'],
        where: {
            createdAt: {
                gte: startDate,
            },
            status: PaymentStatus.COMPLETED,
        },
        _sum: {
            amount: true,
        },
    });

    // Group by date (ignore time)
    const dateMap = new Map<string, number>();

    invoices.forEach(inv => {
        const dateKey = inv.createdAt.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + (inv._sum.amount || 0));
    });

    // Fill in missing dates with 0
    const result: TimeSeriesDataPoint[] = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];

        result.push({
            date: dateKey,
            value: dateMap.get(dateKey) || 0,
        });
    }

    return result;
}

// ==========================================
// BILLING ACCOUNTS TABLE
// ==========================================

export interface BillingAccountRow {
    id: string;
    name: string;
    ownerEmail: string | null;
    subscriptionPlan: PlanType | null;
    subscriptionStatus: SubscriptionStatus | null;
    storeCount: number;
    apiUsageLast30Days: number;
    createdAt: Date;
}

export interface BillingAccountsPageResult {
    accounts: BillingAccountRow[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface GetBillingAccountsParams {
    page?: number;
    pageSize?: number;
    search?: string;
    planType?: PlanType;
    status?: SubscriptionStatus;
    sortBy?: 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
}

export async function getBillingAccountsPage(
    params: GetBillingAccountsParams = {}
): Promise<BillingAccountsPageResult> {
    const {
        page = 1,
        pageSize = 10,
        search,
        planType,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            {
                users: {
                    some: {
                        user: {
                            email: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            },
        ];
    }

    if (planType || status) {
        where.subscription = {};

        if (planType) {
            where.subscription.plan = {
                type: planType,
            };
        }

        if (status) {
            where.subscription.status = status;
        }
    }

    // Get total count and paginated results
    const [totalCount, accounts] = await Promise.all([
        prisma.billingAccount.count({ where }),
        prisma.billingAccount.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                users: {
                    where: {
                        role: 'OWNER',
                    },
                    take: 1,
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
                subscription: {
                    include: {
                        plan: {
                            select: {
                                type: true,
                            },
                        },
                    },
                },
                stores: {
                    select: {
                        id: true,
                    },
                },
                usage: {
                    where: {
                        periodEnd: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                    select: {
                        apiRequestCount: true,
                    },
                },
            },
        }),
    ]);

    const accountRows: BillingAccountRow[] = accounts.map(account => ({
        id: account.id,
        name: account.name,
        ownerEmail: account.users[0]?.user.email || null,
        subscriptionPlan: account.subscription?.plan.type || null,
        subscriptionStatus: account.subscription?.status || null,
        storeCount: account.stores.length,
        apiUsageLast30Days: account.usage.reduce((sum, u) => sum + u.apiRequestCount, 0),
        createdAt: account.createdAt,
    }));

    return {
        accounts: accountRows,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

// ==========================================
// ACCOUNT DETAILS
// ==========================================

export interface BillingAccountDetails {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    owners: {
        userId: string;
        email: string;
        name: string | null;
    }[];
    subscription: {
        planType: PlanType;
        status: SubscriptionStatus;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
    } | null;
    stores: {
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
    }[];
    currentUsage: {
        storeCount: number;
        productCount: number;
        orderCount: number;
        staffCount: number;
        apiRequestCount: number;
    } | null;
}

export async function getBillingAccountDetails(
    accountId: string
): Promise<BillingAccountDetails | null> {
    const account = await prisma.billingAccount.findUnique({
        where: { id: accountId },
        include: {
            users: {
                where: {
                    role: 'OWNER',
                },
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
            subscription: {
                include: {
                    plan: {
                        select: {
                            type: true,
                        },
                    },
                },
            },
            stores: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                },
            },
            usage: {
                orderBy: {
                    periodEnd: 'desc',
                },
                take: 1,
            },
        },
    });

    if (!account) {
        return null;
    }

    return {
        id: account.id,
        name: account.name,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        owners: account.users.map(u => ({
            userId: u.user.id,
            email: u.user.email,
            name: u.user.name,
        })),
        subscription: account.subscription
            ? {
                planType: account.subscription.plan.type,
                status: account.subscription.status,
                currentPeriodStart: account.subscription.currentPeriodStart,
                currentPeriodEnd: account.subscription.currentPeriodEnd,
                cancelAtPeriodEnd: account.subscription.cancelAtPeriodEnd,
            }
            : null,
        stores: account.stores,
        currentUsage: account.usage[0] || null,
    };
}
