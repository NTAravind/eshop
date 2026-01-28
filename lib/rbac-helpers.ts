import prisma from '@/lib/prisma';
import { StoreRole } from '@/app/generated/prisma';

/**
 * Check if a user has access to a store with specific roles
 */
export async function hasStoreAccess(
    userId: string,
    storeId: string,
    allowedRoles: StoreRole[]
): Promise<boolean> {
    // Check if user is super admin
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true }
    });

    if (user?.isSuperAdmin) {
        return true;
    }

    // Check if user has store staff role
    const storeStaff = await prisma.storeStaff.findUnique({
        where: {
            storeId_userId: {
                storeId,
                userId,
            },
        },
        select: { role: true }
    });

    if (!storeStaff) {
        return false;
    }

    return allowedRoles.includes(storeStaff.role);
}
