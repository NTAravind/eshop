/**
 * Auth helpers for storefront API routes
 * Provides authorization utilities for store-level access control
 */

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { StoreRole } from '@/app/generated/prisma';

export interface TenantContext {
    user: {
        id: string;
        email?: string;
    };
}

/**
 * Resolve tenant from session
 * Returns the authenticated user context or null
 */
export async function resolveTenant(): Promise<TenantContext | null> {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    return {
        user: {
            id: session.user.id,
            email: session.user.email ?? undefined,
        },
    };
}

/**
 * Check if a user has access to a specific store with required roles
 */
export async function authorizeStore(
    userId: string,
    storeId: string,
    allowedRoles: StoreRole[]
): Promise<boolean> {
    // Check if user is a super admin
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true },
    });

    if (user?.isSuperAdmin) {
        return true;
    }

    // Check if user is store staff with one of the allowed roles
    const staff = await prisma.storeStaff.findUnique({
        where: {
            storeId_userId: {
                storeId,
                userId,
            },
        },
        select: { role: true },
    });

    if (!staff) {
        return false;
    }

    return allowedRoles.includes(staff.role);
}
