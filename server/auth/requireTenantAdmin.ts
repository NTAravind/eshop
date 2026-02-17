import prisma from '@/lib/prisma';

/**
 * Check if user is admin of a specific billing account
 */
export async function isTenantAdmin(
    userId: string,
    accountId: string
): Promise<boolean> {
    const accountUser = await prisma.accountUser.findUnique({
        where: {
            accountId_userId: { accountId, userId }
        },
        select: { role: true }
    });

    return accountUser?.role === 'OWNER';
}

/**
 * Check if user is admin of the account that owns a store
 */
export async function isTenantAdminForStore(
    userId: string,
    storeId: string
): Promise<boolean> {
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
            account: {
                include: {
                    users: {
                        where: {
                            userId,
                            role: 'OWNER'
                        }
                    }
                }
            }
        }
    });

    return (store?.account.users.length ?? 0) > 0;
}

/**
 * Require user to be tenant admin of a specific account
 * Throws error if not authorized
 */
export async function requireTenantAdmin(
    userId: string,
    accountId: string
): Promise<void> {
    // Check if SuperAdmin first
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true }
    });

    if (user?.isSuperAdmin) {
        return; // SuperAdmin bypasses all checks
    }

    // Check if Tenant Admin
    const accountUser = await prisma.accountUser.findUnique({
        where: {
            accountId_userId: { accountId, userId }
        }
    });

    if (!accountUser || accountUser.role !== 'OWNER') {
        throw new Error('Access denied: Requires account owner role');
    }
}

/**
 * Get all accounts where user is an OWNER (Tenant Admin)
 */
export async function getTenantAdminAccounts(userId: string) {
    // Check if SuperAdmin - return all accounts
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true }
    });

    if (user?.isSuperAdmin) {
        return prisma.billingAccount.findMany({
            include: {
                stores: true,
                subscription: {
                    include: { plan: true }
                }
            }
        });
    }

    // Return only accounts where user is OWNER
    const accountUsers = await prisma.accountUser.findMany({
        where: {
            userId,
            role: 'OWNER'
        },
        include: {
            account: {
                include: {
                    stores: true,
                    subscription: {
                        include: { plan: true }
                    }
                }
            }
        }
    });

    return accountUsers.map(au => au.account);
}
