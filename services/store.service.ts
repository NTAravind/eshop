import prisma from '@/lib/prisma';
import * as subscriptionDal from '@/dal/subscription.dal';
import * as usageService from '@/services/usage.service';

/**
 * Create new store
 */
export async function createStore(
  userId: string,
  input: {
    name: string;
    slug: string;
  }
) {
  // Get user's account
  const account = await subscriptionDal.getAccountByUserId(userId);

  if (!account) {
    throw new Error('User does not have a billing account');
  }

  // ENFORCE STORE LIMIT
  await usageService.checkStoreLimit(account.id);

  // Validation
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Store name is required');
  }

  if (!input.slug || input.slug.trim().length === 0) {
    throw new Error('Store slug is required');
  }

  // Slug validation (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  // Check slug uniqueness
  const existingStore = await prisma.store.findUnique({
    where: { slug: input.slug },
  });

  if (existingStore) {
    throw new Error('Store slug already exists');
  }

  // Create store and assign user as OWNER
  const store = await prisma.$transaction(async (tx) => {
    const newStore = await tx.store.create({
      data: {
        accountId: account.id,
        name: input.name,
        slug: input.slug,
      },
    });

    // Add user as store owner
    await tx.storeStaff.create({
      data: {
        storeId: newStore.id,
        userId,
        role: 'OWNER',
      },
    });

    return newStore;
  });

  // RECORD STORE CREATION
  await usageService.recordStoreCreation(account.id);

  return store;
}

/**
 * Delete store
 */
export async function deleteStore(userId: string, storeId: string) {
  // Verify user is OWNER of the store
  const storeStaff = await prisma.storeStaff.findUnique({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
  });

  if (!storeStaff || storeStaff.role !== 'OWNER') {
    throw new Error('Only store owners can delete stores');
  }

  // Get account for usage tracking
  const account = await subscriptionDal.getAccountByStoreId(storeId);

  // Delete store
  await prisma.store.delete({
    where: { id: storeId },
  });

  // RECORD STORE DELETION
  if (account) {
    await usageService.recordStoreDeletion(account.id);
  }

  return { success: true };
}

/**
 * List stores for user's account
 */
export async function listStoresForUser(userId: string) {
  const account = await subscriptionDal.getAccountByUserId(userId);

  if (!account) {
    return [];
  }

  return prisma.store.findMany({
    where: {
      accountId: account.id,
    },
    include: {
      staff: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get store with account info
 */
export async function getStoreWithAccount(storeId: string) {
  return prisma.store.findUnique({
    where: { id: storeId },
    include: {
      account: {
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      },
    },
  });
}