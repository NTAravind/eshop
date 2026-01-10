import   prisma   from '@/lib/prisma';
import { DiscountType, DiscountScope, Prisma } from '@/app/generated/prisma';

export async function createDiscount(
  storeId: string,
  data: {
    code?: string;
    name: string;
    description?: string;
    type: DiscountType;
    value: number;
    scope: DiscountScope;
    startsAt: Date;
    endsAt: Date;
    maxUsageCount?: number;
    maxUsagePerUser?: number;
    minOrderValue?: number;
    isStackable: boolean;
    productIds?: string[];
    categoryIds?: string[];
  }
) {
  return prisma.discount.create({
    data: {
      storeId,
      code: data.code?.toUpperCase() || null,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      scope: data.scope,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      maxUsageCount: data.maxUsageCount,
      maxUsagePerUser: data.maxUsagePerUser,
      minOrderValue: data.minOrderValue,
      isStackable: data.isStackable,
      products: data.productIds?.length
        ? {
            create: data.productIds.map(productId => ({ productId })),
          }
        : undefined,
      categories: data.categoryIds?.length
        ? {
            create: data.categoryIds.map(categoryId => ({ categoryId })),
          }
        : undefined,
    },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
}

export async function updateDiscount(
  storeId: string,
  discountId: string,
  data: {
    code?: string;
    name?: string;
    description?: string;
    value?: number;
    startsAt?: Date;
    endsAt?: Date;
    maxUsageCount?: number;
    maxUsagePerUser?: number;
    minOrderValue?: number;
    isStackable?: boolean;
    isActive?: boolean;
    productIds?: string[];
    categoryIds?: string[];
  }
) {
  // Verify discount belongs to store
  const discount = await prisma.discount.findFirst({
    where: { id: discountId, storeId },
  });

  if (!discount) {
    throw new Error('Discount not found');
  }

  // Handle product/category updates
  const updateData: any = {
    ...(data.code !== undefined && { code: data.code?.toUpperCase() || null }),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.value !== undefined && { value: data.value }),
    ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
    ...(data.endsAt !== undefined && { endsAt: data.endsAt }),
    ...(data.maxUsageCount !== undefined && { maxUsageCount: data.maxUsageCount }),
    ...(data.maxUsagePerUser !== undefined && { maxUsagePerUser: data.maxUsagePerUser }),
    ...(data.minOrderValue !== undefined && { minOrderValue: data.minOrderValue }),
    ...(data.isStackable !== undefined && { isStackable: data.isStackable }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  };

  // Update products if provided
  if (data.productIds !== undefined) {
    await prisma.discountProduct.deleteMany({
      where: { discountId },
    });
    if (data.productIds.length > 0) {
      updateData.products = {
        create: data.productIds.map(productId => ({ productId })),
      };
    }
  }

  // Update categories if provided
  if (data.categoryIds !== undefined) {
    await prisma.discountCategory.deleteMany({
      where: { discountId },
    });
    if (data.categoryIds.length > 0) {
      updateData.categories = {
        create: data.categoryIds.map(categoryId => ({ categoryId })),
      };
    }
  }

  return prisma.discount.update({
    where: { id: discountId },
    data: updateData,
    include: {
      products: {
        include: {
          product: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
}

export async function deleteDiscount(storeId: string, discountId: string) {
  const discount = await prisma.discount.findFirst({
    where: { id: discountId, storeId },
  });

  if (!discount) {
    throw new Error('Discount not found');
  }

  return prisma.discount.delete({
    where: { id: discountId },
  });
}

export async function getDiscountById(storeId: string, discountId: string) {
  return prisma.discount.findFirst({
    where: {
      id: discountId,
      storeId,
    },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          usages: true,
        },
      },
    },
  });
}

export async function getDiscountByCode(storeId: string, code: string) {
  return prisma.discount.findFirst({
    where: {
      storeId,
      code: code.toUpperCase(),
      isActive: true,
    },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
}

export async function listDiscounts(
  storeId: string,
  filters?: {
    isActive?: boolean;
    scope?: DiscountScope;
    skip?: number;
    take?: number;
  }
) {
  const where: Prisma.DiscountWhereInput = {
    storeId,
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.scope && { scope: filters.scope }),
  };

  const [discounts, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 50,
      include: {
        products: {
          include: {
            product: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.discount.count({ where }),
  ]);

  return { discounts, total };
}

/**
 * Get applicable discounts for order (time-constrained, active)
 */
export async function getApplicableDiscounts(
  storeId: string,
  now: Date = new Date()
) {
  return prisma.discount.findMany({
    where: {
      storeId,
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
}

/**
 * Get user's usage count for a discount
 */
export async function getUserDiscountUsageCount(
  discountId: string,
  userId: string
) {
  return prisma.discountUsage.count({
    where: {
      discountId,
      userId,
    },
  });
}

/**
 * Get total usage count for a discount
 */
export async function getDiscountTotalUsageCount(discountId: string) {
  return prisma.discountUsage.count({
    where: { discountId },
  });
}

/**
 * Record discount usage
 */
export async function recordDiscountUsage(
  discountId: string,
  orderId: string,
  userId?: string
) {
  return prisma.discountUsage.create({
    data: {
      discountId,
      orderId,
      userId,
    },
  });
}