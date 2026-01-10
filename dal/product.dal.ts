import prisma from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma';

/**
 * Create product
 */
export async function createProduct(
  storeId: string,
  data: {
    name: string;
    description?: string;
    categoryId?: string;
    isActive?: boolean;
  }
) {
  return prisma.product.create({
    data: {
      storeId,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      isActive: data.isActive ?? true,
    },
    include: {
      category: true,
      variants: {
        where: { deletedAt: null },
      },
      images: true,
    },
  });
}

/**
 * Update product
 */
export async function updateProduct(
  storeId: string,
  productId: string,
  data: {
    name?: string;
    description?: string;
    categoryId?: string;
    isActive?: boolean;
  }
) {
  return prisma.product.update({
    where: {
      id: productId,
      storeId,
      deletedAt: null,
    },
    data,
    include: {
      category: true,
      variants: {
        where: { deletedAt: null },
      },
      images: true,
    },
  });
}

/**
 * Soft delete product
 */
export async function deleteProduct(storeId: string, productId: string) {
  return prisma.product.update({
    where: {
      id: productId,
      storeId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
}

/**
 * Get product by ID (excludes soft-deleted)
 */
export async function getProductById(storeId: string, productId: string) {
  return prisma.product.findFirst({
    where: {
      id: productId,
      storeId,
      deletedAt: null,
    },
    include: {
      category: {
        where: { deletedAt: null },
      },
      variants: {
        where: { deletedAt: null },
        include: {
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
      },
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
 * List products with filters (excludes soft-deleted)
 */
export async function listProducts(
  storeId: string,
  filters?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }
) {
  const where: Prisma.ProductWhereInput = {
    storeId,
    deletedAt: null,
    ...(filters?.categoryId && { 
      categoryId: filters.categoryId,
      category: { deletedAt: null },
    }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 50,
      include: {
        category: {
          where: { deletedAt: null },
        },
        variants: {
          where: { deletedAt: null },
          include: {
            images: true,
          },
        },
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

/**
 * Attach category to product
 */
export async function attachCategory(
  storeId: string,
  productId: string,
  categoryId: string | null
) {
  return prisma.product.update({
    where: {
      id: productId,
      storeId,
      deletedAt: null,
    },
    data: {
      categoryId,
    },
  });
}

/**
 * Attach facet values to product
 */
export async function attachFacetValuesToProduct(
  storeId: string,
  productId: string,
  facetValueIds: string[]
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId, deletedAt: null },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Delete existing facet values
  await prisma.productFacetValue.deleteMany({
    where: { productId },
  });

  // Create new associations
  if (facetValueIds.length > 0) {
    await prisma.productFacetValue.createMany({
      data: facetValueIds.map(facetValueId => ({
        productId,
        facetValueId,
      })),
    });
  }

  return prisma.product.findUnique({
    where: { id: productId },
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