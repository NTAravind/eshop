import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AuthContextValue, AuthScope } from '@/types/auth-types';

interface RbacOptions {
    storeId?: string;
    accountId?: string;
}

/**
 * Server-side helper to build the Auth Context based on the current user and context.
 * Fetches roles from the database and maps them to standard scopes.
 */
export async function getRbacContext(options: RbacOptions = {}): Promise<AuthContextValue | null> {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return null; // Not authenticated
    }

    const { id: userId, email } = session.user;

    // 1. Fetch User core data (Super Admin check)
    // We already have some session data, but to be "production-grade" and "backend enforcement",
    // we should fetch the latest status from DB if critical, or trust session if strategy is database.
    // Since session strategy IS database, session.user is fairly fresh (24h).
    // But isSuperAdmin might be missing in session type. 
    // Let's fetch the user to be sure about Super Admin status.
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true }
    });

    const isSuperAdmin = user?.isSuperAdmin || false;
    const scopes: Set<AuthScope> = new Set();

    // 2. Global Scopes
    if (isSuperAdmin) {
        scopes.add('super_admin');
    }

    let activeTenantId = options.accountId;
    let activeStoreId = options.storeId;

    // 3. Store Context
    if (activeStoreId) {
        const storeStaff = await prisma.storeStaff.findUnique({
            where: {
                storeId_userId: {
                    storeId: activeStoreId,
                    userId,
                }
            },
            include: {
                store: {
                    select: { accountId: true }
                }
            }
        });

        if (storeStaff) {
            // Map Store Role to Scopes
            switch (storeStaff.role) {
                case 'OWNER':
                    scopes.add('store_owner');
                    break;
                case 'MANAGER':
                    scopes.add('store_manager');
                    break;
                case 'SUPPORT':
                    scopes.add('store_support');
                    break;
            }

            // Implicitly resolve tenant if not provided
            if (!activeTenantId) {
                activeTenantId = storeStaff.store.accountId;
            }
        } else if (isSuperAdmin) {
            // Super admins implicitly have store scopes?
            // Usually explicit is better, but super_admin overrides checks mostly.
            // Let's generic super_admin handle it.
        } else {
            // Check if user is TENANT owner of this store
            // We need to know the accountId of the store first
            const store = await prisma.store.findUnique({
                where: { id: activeStoreId },
                select: { accountId: true }
            });

            if (store) {
                if (!activeTenantId) activeTenantId = store.accountId;
                // We will check tenant permissions below
            }
        }
    }

    // 4. Tenant Context
    if (activeTenantId) {
        const accountUser = await prisma.accountUser.findUnique({
            where: {
                accountId_userId: {
                    accountId: activeTenantId,
                    userId,
                }
            }
        });

        if (accountUser) {
            // Map Account Role to Scopes
            // Schema role is String. Assuming 'OWNER', 'MEMBER'.
            if (accountUser.role === 'OWNER') {
                scopes.add('tenant_owner');
                // Tenant Owner implies Store Owner for all stores? 
                // Usually yes. But we handle that by checking hasScope('tenant_owner') || hasScope('store_owner') in UI.
            } else if (accountUser.role === 'ADMIN') {
                scopes.add('tenant_admin');
            } else {
                scopes.add('tenant_member');
            }
        }
    }

    // Super Admin inherits all capabilities in theory, 
    // but explicit scopes help UI.
    // For now, we rely on hasScope checking 'super_admin' OR specific scope.

    return {
        userId,
        email,
        isSuperAdmin,
        activeTenantId,
        activeStoreId,
        scopes: Array.from(scopes).sort()
    };
}
