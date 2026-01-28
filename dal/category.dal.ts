import prisma from '@/lib/prisma';

/**
 * Create category
 */
export async function createCategory(
  storeId: string,
  data: {
    name: string;
    slug: string;
    parentId?: string;
  }
) {
  if (data.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: data.parentId, storeId, deletedAt: null },
    });
    if (!parent) {
      throw new Error('Parent category not found in this store');
    }
  }

  return prisma.category.create({
    data: {
      storeId,
      name: data.name,
      slug: data.slug,
      parentId: data.parentId,
    },
    include: {
      parent: true,
      children: {
        where: { deletedAt: null },
      },
    },
  });
}

/**
 * Update category
 */
export async function updateCategory(
  storeId: string,
  categoryId: string,
  data: {
    name?: string;
    slug?: string;
    parentId?: string;
  }
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId, deletedAt: null },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (data.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: data.parentId, storeId, deletedAt: null },
    });
    if (!parent) {
      throw new Error('Parent category not found in this store');
    }

    if (data.parentId === categoryId) {
      throw new Error('Category cannot be its own parent');
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data,
    include: {
      parent: true,
      children: {
        where: { deletedAt: null },
      },
    },
  });
}

/**
 * Soft delete category
 */
export async function deleteCategory(storeId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId, deletedAt: null },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function listCategories(storeId: string) {
  return prisma.category.findMany({
    where: { storeId, deletedAt: null },
    include: {
      parent: {
        where: { deletedAt: null },
      },
      children: {
        where: { deletedAt: null },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryTree(storeId: string) {
  const allCategories = await prisma.category.findMany({
    where: { storeId, deletedAt: null },
    include: {
      children: {
        where: { deletedAt: null },
        include: {
          children: {
            where: { deletedAt: null },
          },
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return allCategories.filter(cat => cat.parentId === null);
}

export async function getCategoryById(storeId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      storeId,
      deletedAt: null,
    },
    include: {
      parent: {
        where: { deletedAt: null },
      },
      children: {
        where: { deletedAt: null },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
}