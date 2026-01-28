import prisma from '../prisma';
import { StoreRole } from '@/app/generated/prisma';

const ROLE_HIERARCHY: Record<StoreRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  SUPPORT: 1,
};

/**
 * Hierarchical access control for store routes
 * 
 * Access hierarchy:
 * 1. SuperAdmin - Full access to all stores
 * 2. Tenant Admin (AccountUser OWNER) - Access to all stores in their account
 * 3. Store Staff - Access based on their role in the store
 */
export async function requireStoreRole(
  userId: string,
  storeId: string,
  minimumRole: StoreRole
): Promise<StoreRole> {
  // 1. Check if SuperAdmin - bypass all checks
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true }
  });

  if (user?.isSuperAdmin) {
    return 'OWNER'; // SuperAdmin has OWNER-level access everywhere
  }

  // 2. Check if Tenant Admin (owns the account that owns this store)
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      account: {
        include: {
          users: {
            where: {
              userId,
              role: 'OWNER' // Only OWNER role in AccountUser counts as Tenant Admin
            }
          }
        }
      }
    }
  });

  if (store?.account.users.length && store.account.users.length > 0) {
    return 'OWNER'; // Tenant Admin has OWNER-level access to their stores
  }

  // 3. Check StoreStaff (existing logic for Store Admins)
  const staff = await prisma.storeStaff.findUnique({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
  });

  if (!staff) {
    throw new Error('Access denied: Not a member of this store');
  }

  const userLevel = ROLE_HIERARCHY[staff.role];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  if (userLevel < requiredLevel) {
    throw new Error(`Access denied: Requires ${minimumRole} role or higher`);
  }

  return staff.role;
}

export function canManageApiKeys(role: StoreRole): boolean {
  return role === 'OWNER';
}

export function canWrite(role: StoreRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canRead(role: StoreRole): boolean {
  return true; // All roles can read
}