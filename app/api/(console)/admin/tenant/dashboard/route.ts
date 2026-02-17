import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as subscriptionDal from '@/dal/subscription.dal';
import * as storeDataLayer from '@/dal/store.dal';
import prisma from '@/lib/prisma'; // Direct prisma for efficient aggregation if needed, or use DAL

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        let userType: 'TENANT_ADMIN' | 'STORE_STAFF' = 'TENANT_ADMIN';

        // 1. Try to get Billing Account (Tenant Admin Status)
        const account = await subscriptionDal.getAccountByUserId(userId);
        let validTenantAdmin = false;

        if (account) {
            // Verify Ownership/Membership explicitly
            const accountUser = await prisma.accountUser.findFirst({
                where: { accountId: account.id, userId } // Allow any member, not just OWNER? Revisit if needed.
            });
            if (accountUser) {
                validTenantAdmin = true;
            }
        }

        // 2. If NOT a valid Tenant Admin, check if they are Store Staff
        if (!validTenantAdmin) {
            const staffRecords = await prisma.storeStaff.findMany({
                where: { userId },
                include: {
                    store: {
                        include: {
                            _count: {
                                select: { orders: true, products: true }
                            }
                        }
                    }
                }
            });

            if (staffRecords.length > 0) {
                // User is a Store Staff
                return NextResponse.json({
                    type: 'STORE_STAFF',
                    account: null,
                    stores: staffRecords.map(record => ({
                        id: record.store.id,
                        name: record.store.name,
                        slug: record.store.slug,
                        orderCount: record.store._count.orders,
                        productCount: record.store._count.products,
                        role: record.role
                    })),
                    stats: {
                        revenue: 0, // Hidden for staff aggregation
                        orders: 0,
                        products: 0,
                        storeCount: staffRecords.length
                    }
                });
            }

            // If neither, return 404/403
            return NextResponse.json({ error: 'No account or store access found' }, { status: 404 });
        }

        // 3. Tenant Admin Logic (Existing)
        const stores = await prisma.store.findMany({
            where: { accountId: account!.id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true, products: true }
                }
            }
        });

        const [revenueStats, orderStats, productStats] = await Promise.all([
            prisma.order.aggregate({
                where: { store: { accountId: account!.id }, status: 'PAID' },
                _sum: { total: true }
            }),
            prisma.order.count({ where: { store: { accountId: account!.id } } }),
            prisma.product.count({ where: { store: { accountId: account!.id } } }),
        ]);

        return NextResponse.json({
            type: 'TENANT_ADMIN',
            account: {
                id: account!.id,
                name: account!.name,
            },
            stores: stores.map(store => ({
                id: store.id,
                name: store.name,
                slug: store.slug,
                orderCount: store._count.orders,
                productCount: store._count.products
            })),
            stats: {
                revenue: revenueStats._sum.total || 0,
                orders: orderStats,
                products: productStats,
                storeCount: stores.length
            }
        });

    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
