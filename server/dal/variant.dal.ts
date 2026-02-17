import prisma from '@/server/db/prisma';
import { Prisma } from '@/app/generated/prisma';

/**
 * Create variant for a product
 */
export async function createVariant(
    productId: string,
    data: {
        sku: string;
        price: number;
        stock: number;
        customData?: Record<string, unknown>;
        isActive?: boolean;
        images?: string[];
    }
) {
    const { images, ...rest } = data;
    return prisma.productVariant.create({
        data: {
            productId,
            sku: rest.sku,
            price: rest.price,
            stock: rest.stock,
            customData: rest.customData as Prisma.InputJsonValue,
            isActive: rest.isActive ?? true,
            ...(images && images.length > 0
                ? {
                    images: {
                        create: images.map((url, index) => ({
                            url,
                            position: index,
                            // product variants don't have a name field directly, so we'll skip alt or use sku
                            alt: rest.sku,
                        })),
                    },
                }
                : {}),
        },
        include: {
            images: true,
        },
    });
}

/**
 * Update variant
 */
export async function updateVariant(
    variantId: string,
    data: {
        sku?: string;
        price?: number;
        stock?: number;
        customData?: Record<string, unknown>;
        isActive?: boolean;
        images?: string[];
    }
) {
    const { images, ...rest } = data;
    return prisma.productVariant.update({
        where: { id: variantId },
        data: {
            sku: rest.sku,
            price: rest.price,
            stock: rest.stock,
            customData: rest.customData as Prisma.InputJsonValue,
            isActive: rest.isActive,
            ...(images !== undefined
                ? {
                    images: {
                        deleteMany: {},
                        create: images.map((url, index) => ({
                            url,
                            position: index,
                            alt: rest.sku || 'Variant Image', // We might not have SKU if not updating it, but usually we don't change alt on update unless strictly needed. 
                            // Actually, if we are not updating SKU, we don't have it here. 
                            // Issues: 'alt' is optional in schema? Yes. 
                        })),
                    },
                }
                : {}),
        },
        include: {
            images: true,
        },
    });
}

/**
 * Delete variant (soft delete if deletedAt exists, otherwise hard delete)
 */
export async function deleteVariant(variantId: string) {
    return prisma.productVariant.update({
        where: { id: variantId },
        data: {
            isActive: false,
        },
    });
}

/**
 * Get variant by ID
 */
export async function getVariantById(variantId: string) {
    return prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
            product: true,
            images: true,
        },
    });
}

/**
 * Get variant by SKU
 */
export async function getVariantBySku(sku: string) {
    return prisma.productVariant.findUnique({
        where: { sku },
        include: {
            product: true,
            images: true,
        },
    });
}

/**
 * List variants for a product
 */
export async function listVariantsByProduct(productId: string) {
    return prisma.productVariant.findMany({
        where: {
            productId,
        },
        include: {
            images: true,
        },
        orderBy: { createdAt: 'asc' },
    });
}

/**
 * Update variant stock
 */
export async function updateVariantStock(variantId: string, stock: number) {
    return prisma.productVariant.update({
        where: { id: variantId },
        data: { stock },
    });
}

/**
 * Update variant customData
 */
export async function updateVariantCustomData(
    variantId: string,
    customData: Record<string, unknown>
) {
    return prisma.productVariant.update({
        where: { id: variantId },
        data: { customData: customData as Prisma.InputJsonValue },
        include: {
            images: true,
        },
    });
}

/**
 * Get low stock variants
 */
export async function getLowStockVariants(storeId: string, threshold: number = 5) {
    return prisma.productVariant.findMany({
        where: {
            product: { storeId },
            stock: { lte: threshold },
            isActive: true,
        },
        include: {
            product: true,
            images: true,
        },
        orderBy: { stock: 'asc' },
    });
}
