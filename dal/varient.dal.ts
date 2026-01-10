import prisma from '@/lib/prisma';

/**
 * Create variant
 */
export async function createVariant(
  storeId: string,
  productId: string,
  data: {
    sku: string;
    price: number;
    stock: number;
    isActive?: boolean;
  }
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId, deletedAt: null },
  });

  if (!product) {
    throw new Error('Product not found in this store');
  }

  return prisma.productVariant.create({
    data: {
      productId,
      sku: data.sku,
      price: data.price,
      stock: data.stock,
      isActive: data.isActive ?? true,
    },
    include: {
      product: true,
      images: true,
      facets: {
        include: {
          facetValue: {
            include: {
              facet: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Update variant
 */
export async function updateVariant(
  storeId: string,
  variantId: string,
  data: {
    sku?: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
  }
) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: {
        storeId,
        deletedAt: null,
      },
      deletedAt: null,
    },
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data,
    include: {
      product: true,
      images: true,
      facets: {
        include: {
          facetValue: {
            include: {
              facet: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Soft delete variant
 */
export async function deleteVariant(storeId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: {
        storeId,
      },
      deletedAt: null,
    },
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
}

/**
 * Get variant by ID (excludes soft-deleted)
 */
export async function getVariantById(storeId: string, variantId: string) {
  return prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: {
        storeId,
        deletedAt: null,
      },
      deletedAt: null,
    },
    include: {
      product: true,
      images: true,
      facets: {
        include: {
          facetValue: {
            include: {
              facet: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Atomic stock update with race condition prevention
 * Uses conditional updateMany to ensure stock never goes negative
 * 
 * CRITICAL: This is the ONLY safe way to update stock under concurrency
 */
export async function updateStockAtomic(
  storeId: string,
  variantId: string,
  delta: number
) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: {
        storeId,
        deletedAt: null,
      },
      deletedAt: null,
    },
    select: { id: true, stock: true },
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  // For decrements, prevent negative stock
  const minStock = delta < 0 ? Math.abs(delta) : 0;

  const updateResult = await prisma.productVariant.updateMany({
    where: {
      id: variantId,
      stock: { gte: minStock },
    },
    data: {
      stock: {
        increment: delta,
      },
    },
  });

  if (updateResult.count === 0) {
    throw new Error(
      `Insufficient stock. Available: ${variant.stock}, Requested: ${Math.abs(delta)}`
    );
  }

  return prisma.productVariant.findUnique({
    where: { id: variantId },
  });
}

/**
 * Attach facet values to variant
 */
export async function attachFacetValuesToVariant(
  storeId: string,
  variantId: string,
  facetValueIds: string[]
) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: {
        storeId,
        deletedAt: null,
      },
      deletedAt: null,
    },
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  // Delete existing facet values
  await prisma.variantFacetValue.deleteMany({
    where: { variantId },
  });

  // Create new associations
  if (facetValueIds.length > 0) {
    await prisma.variantFacetValue.createMany({
      data: facetValueIds.map(facetValueId => ({
        variantId,
        facetValueId,
      })),
    });
  }

  return prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      facets: {
        include: {
          facetValue: {
            include: {
              facet: true,
            },
          },
        },
      },
    },
  });
}