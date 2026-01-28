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
    isActive?: boolean;
  }
) {
  return prisma.product.create({
    data: {
      storeId,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      productSchemaId: data.productSchemaId,
      customData: data.customData,
      isActive: data.isActive ?? true,
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
    isActive?: boolean;
  }
) {
  return prisma.product.update({
    where: {
      id: productId,
      storeId,
    },
    data,
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
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }
) {
  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(filters?.categoryId && {
      categoryId: filters.categoryId,
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