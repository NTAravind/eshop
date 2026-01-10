import prisma from '../prisma';
import { StoreRole } from '@/app/generated/prisma';

const ROLE_HIERARCHY: Record<StoreRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  SUPPORT: 1,
};

export async function requireStoreRole(
  userId: string,
  storeId: string,
  minimumRole: StoreRole
): Promise<StoreRole> {
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