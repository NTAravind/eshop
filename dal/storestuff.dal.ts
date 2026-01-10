import  prisma from '@/lib/prisma';
import { StoreRole } from '@/app/generated/prisma';

export async function addStoreStaff(
  storeId: string,
  userId: string,
  role: StoreRole
) {
  return prisma.storeStaff.create({
    data: {
      storeId,
      userId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function updateStoreStaffRole(
  storeId: string,
  userId: string,
  role: StoreRole
) {
  return prisma.storeStaff.update({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function removeStoreStaff(storeId: string, userId: string) {
  return prisma.storeStaff.delete({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
  });
}

export async function getStoreStaff(storeId: string, userId: string) {
  return prisma.storeStaff.findUnique({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function listStoreStaff(storeId: string) {
  return prisma.storeStaff.findMany({
    where: { storeId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserStores(userId: string) {
  return prisma.storeStaff.findMany({
    where: { userId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function countStoreOwners(storeId: string) {
  return prisma.storeStaff.count({
    where: {
      storeId,
      role: 'OWNER',
    },
  });
}

export async function isLastOwner(storeId: string, userId: string) {
  const staff = await prisma.storeStaff.findUnique({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
  });

  if (!staff || staff.role !== 'OWNER') {
    return false;
  }

  const ownerCount = await countStoreOwners(storeId);
  return ownerCount === 1;
}