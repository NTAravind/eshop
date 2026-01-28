import prisma from '@/lib/prisma';
import { OrderStatus } from '@/app/generated/prisma';

export interface TenantOverview {
    revenue: number;
    orders: number;
    products: number;
    stores: number;
}

/**
 * Aggregates data across all stores for a tenant (billing account)
 */
export async function getTenantOverview(userId: string): Promise<TenantOverview | null> {
    // 1. Get user's billing account
    const accountUser = await prisma.accountUser.findFirst({
        where: { userId },
        select: { accountId: true },
    });

    if (!accountUser) {
        return null;
    }

    const accountId = accountUser.accountId;

    // 2. Run aggregations in parallel
    const [revenue, orders, products, stores] = await Promise.all([
        // Total Revenue (Paid Orders)
        prisma.order.aggregate({
            where: {
                store: { accountId },
                status: OrderStatus.PAID,
            },
            _sum: { total: true },
        }),

        // Total Orders
        prisma.order.count({
            where: {
                store: { accountId },
            },
        }),

        // Total Products
        prisma.product.count({
            where: {
                store: { accountId },
            }
        }),

        // Total Stores
        prisma.store.count({
            where: { accountId },
        }),
    ]);

    return {
        revenue: revenue._sum.total || 0,
        orders,
        products,
        stores,
    };
}
