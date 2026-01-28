import prisma from '@/lib/prisma';
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
        customData?: Record<string, any>;
        isActive?: boolean;
    }
) {
    return prisma.productVariant.create({
        data: {
            productId,
            sku: data.sku,
            price: data.price,
            stock: data.stock,
            customData: data.customData,
            isActive: data.isActive ?? true,
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
        customData?: Record<string, any>;
        isActive?: boolean;
    }
) {
    return prisma.productVariant.update({
        where: { id: variantId },
        data,
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
    customData: Record<string, any>
) {
    return prisma.productVariant.update({
        where: { id: variantId },
        data: { customData },
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
