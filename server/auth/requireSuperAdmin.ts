import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Requires the current user to be a superadmin.
 * Throws an error if not authenticated or not a superadmin.
 * 
 * @returns The authenticated superadmin user
 * @throws Error if not authenticated or not a superadmin
 */
export async function requireSuperAdmin() {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('Unauthorized: Authentication required');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            isSuperAdmin: true
        }
    });

    if (!user?.isSuperAdmin) {
        throw new Error('Forbidden: Superadmin access required');
    }

    return user;
}

/**
 * Checks if the current user is a superadmin without throwing.
 * 
 * @returns true if user is authenticated and is a superadmin, false otherwise
 */
export async function isSuperAdmin(): Promise<boolean> {
    try {
        const session = await auth();
        if (!session?.user?.id) return false;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isSuperAdmin: true }
        });

        return user?.isSuperAdmin ?? false;
    } catch {
        return false;
    }
}
