import prisma from '@/lib/prisma';
import { OrderStatus } from '@/app/generated/prisma';

export interface StoreOverview {
    revenue: number;
    orders: number;
    products: number;
    lowStock: number;
}

/**
 * Aggregates data for a specific store
 */
export async function getStoreOverview(storeId: string): Promise<StoreOverview> {
    const [revenue, orders, products, lowStock] = await Promise.all([
        // Store Revenue
        prisma.order.aggregate({
            where: {
                storeId,
                status: OrderStatus.PAID,
            },
            _sum: { total: true },
        }),

        // Store Orders
        prisma.order.count({
            where: { storeId },
        }),

        // Store Products
        prisma.product.count({
            where: {
                storeId,
            },
        }),

        // Low Stock Items (Stock <= 5)
        prisma.productVariant.count({
            where: {
                product: { storeId },
                stock: { lte: 5 },
                isActive: true,
            },
        }),
    ]);

    return {
        revenue: revenue._sum.total || 0,
        orders,
        products,
        lowStock,
    };
}

/**
 * Get store by slug
 */
export async function getStoreBySlug(slug: string) {
    return prisma.store.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            accountId: true,
        },
    });
}

/**
 * Get user's role in a store
 */
export async function getUserStoreRole(userId: string, storeId: string) {
    const staff = await prisma.storeStaff.findUnique({
        where: {
            storeId_userId: {
                storeId,
                userId,
            },
        },
        select: {
            role: true,
        },
    });

    return staff?.role || null;
}

/**
 * Update store settings
 */
export async function updateStore(storeId: string, data: { name?: string; currency?: string; requirePhoneNumber?: boolean }) {
    return prisma.store.update({
        where: { id: storeId },
        data,
    });
}
