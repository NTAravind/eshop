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
    productSchemaId?: string;
    customData?: Record<string, any>;
    images?: string[];
    isActive?: boolean;
  }
) {
  const { images, ...rest } = data;
  return prisma.product.create({
    data: {
      storeId,
      name: rest.name,
      description: rest.description,
      categoryId: rest.categoryId,
      productSchemaId: rest.productSchemaId,
      customData: rest.customData,
      isActive: rest.isActive ?? true,
      ...(images && images.length > 0
        ? {
            images: {
              create: images.map((url, index) => ({
                url,
                position: index,
                alt: rest.name,
              })),
            },
          }
        : {}),
    },
    include: {
      category: true,
      variants: true,
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
    productSchemaId?: string;
    customData?: Record<string, any>;
    images?: string[];
    isActive?: boolean;
  }
) {
  const { images, ...rest } = data;
  return prisma.product.update({
    where: {
      id: productId,
      storeId,
    },
    data: {
      ...rest,
      ...(images !== undefined
        ? {
            images: {
              deleteMany: {},
              create: images.map((url, index) => ({
                url,
                position: index,
                alt: rest.name,
              })),
            },
          }
        : {}),
    },
    include: {
      category: true,
      variants: true,
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
    },
    data: {
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
    },
    include: {
      category: true,
      variants: {
        include: {
          images: true,
        },
      },
      images: true,
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
    productSchemaId?: string;
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
    facets?: Record<string, string[]>; // code -> values (OR within facet, AND between facets)
  }
) {
  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(filters?.categoryId && {
      categoryId: filters.categoryId,
    }),
    ...(filters?.productSchemaId && {
      productSchemaId: filters.productSchemaId,
    }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };

  // Append facet filters
  if (filters?.facets && Object.keys(filters.facets).length > 0) {
    const facetFilters: Prisma.ProductWhereInput[] = [];

    Object.entries(filters.facets).forEach(([code, values]) => {
      if (values.length === 0) return;

      // Filter products that have matching ProductFacetValue OR matching VariantFacetValue
      // We check via the relation to Facet (by code) and FacetValue (by value)
      facetFilters.push({
        OR: [
          // Product-level match
          {
            facetValues: {
              some: {
                facet: { code },
                facetValue: { value: { in: values } }
              }
            }
          },
          // Variant-level match
          {
            variants: {
              some: {
                facetValues: {
                  some: {
                    facet: { code },
                    facetValue: { value: { in: values } }
                  }
                }
              }
            }
          }
        ]
      });
    });

    if (facetFilters.length > 0) {
      where.AND = facetFilters;
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 50,
      include: {
        category: true,
        variants: {
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
    },
    data: {
      categoryId,
    },
  });
}

/**
 * Update product customData
 */
export async function updateProductCustomData(
  storeId: string,
  productId: string,
  customData: Record<string, any>
) {
  return prisma.product.update({
    where: {
      id: productId,
      storeId,
    },
    data: {
      customData,
    },
    include: {
      category: true,
      variants: true,
      images: true,
    },
  });
}
