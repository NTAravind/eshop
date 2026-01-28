import prisma from '@/lib/prisma';
import { OrderStatus } from '@/app/generated/prisma';

export interface CustomerRow {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: Date | null;
    firstOrderAt: Date | null;
}

export interface CustomerListResult {
    customers: CustomerRow[];
    total: number;
}

/**
 * List customers for a specific store.
 * Derived from Users who have placed orders in the store.
 */
export async function listStoreCustomers(
    storeId: string,
    params: {
        skip?: number;
        take?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
): Promise<CustomerListResult> {
    const { skip = 0, take = 50, search } = params;

    // Build where clause to find users with orders in this store
    const where: any = {
        orders: {
            some: {
                storeId,
            },
        },
    };

    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            skip,
            take,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                orders: {
                    where: { storeId },
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                        status: true,
                    },
                },
            },
            // Note: Sorting by aggregate fields (like totalSpent) isn't directly supported in prisma findMany
            // We default to sorting by user email or name for pagination stability
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    const customers = (users as any[]).map((user) => {
        const paidOrders = user.orders.filter((o: any) => o.status === OrderStatus.PAID);
        const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + o.total, 0);

        // Sort orders to find first/last
        const sortedOrders = [...user.orders].sort((a: any, b: any) =>
            b.createdAt.getTime() - a.createdAt.getTime()
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            totalOrders: user.orders.length,
            totalSpent,
            lastOrderAt: sortedOrders[0]?.createdAt || null,
            firstOrderAt: sortedOrders[sortedOrders.length - 1]?.createdAt || null,
        };
    });

    return {
        customers,
        total,
    };
}
