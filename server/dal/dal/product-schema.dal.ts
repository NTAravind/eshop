import prisma from '@/lib/prisma';
import type { Prisma } from '../app/generated/prisma';

/**
 * Get active product schema for a store
 */
export async function getActiveProductSchema(storeId: string) {
    return await prisma.productSchema.findFirst({
        where: {
            storeId,
            isActive: true,
        },
        orderBy: {
            version: 'desc',
        },
    });
}



/**
 * Create a new product schema
 */
export async function createProductSchema(data: {
    storeId: string;
    name: string;
    fields: Prisma.InputJsonValue;
    version?: number;
}) {
    // Get the next version number if not provided
    if (!data.version) {
        const latestSchema = await prisma.productSchema.findFirst({
            where: { storeId: data.storeId },
            orderBy: { version: 'desc' },
            select: { version: true },
        });
        data.version = (latestSchema?.version || 0) + 1;
    }

    return await prisma.productSchema.create({
        data: {
            storeId: data.storeId,
            name: data.name,
            fields: data.fields,
            version: data.version,
            isActive: true,
        },
    });
}

/**
 * Update product schema
 */
export async function updateProductSchema(
    id: string,
    data: {
        name?: string;
        fields?: Prisma.InputJsonValue;
        isActive?: boolean;
    }
) {
    return await prisma.productSchema.update({
        where: { id },
        data,
    });
}

/**
 * List product schemas for a store
 */
export async function listProductSchemas(storeId: string) {
    return await prisma.productSchema.findMany({
        where: { storeId },
        orderBy: { version: 'desc' },
    });
}

/**
 * Deactivate all product schemas for a store
 */
export async function deactivateProductSchemas(storeId: string) {
    return await prisma.productSchema.updateMany({
        where: { storeId },
        data: { isActive: false },
    });
}

// ===============================
// VARIANT SCHEMA OPERATIONS
// ===============================

/**
 * Get active variant schema for a store
 */
export async function getActiveVariantSchema(storeId: string) {
    return await prisma.variantSchema.findFirst({
        where: {
            storeId,
            isActive: true,
        },
        orderBy: {
            version: 'desc',
        },
    });
}



/**
 * Create a new variant schema
 */
export async function createVariantSchema(data: {
    storeId: string;
    name: string;
    fields: Prisma.InputJsonValue;
    version?: number;
}) {
    // Get the next version number if not provided
    if (!data.version) {
        const latestSchema = await prisma.variantSchema.findFirst({
            where: { storeId: data.storeId },
            orderBy: { version: 'desc' },
            select: { version: true },
        });
        data.version = (latestSchema?.version || 0) + 1;
    }

    return await prisma.variantSchema.create({
        data: {
            storeId: data.storeId,
            name: data.name,
            fields: data.fields,
            version: data.version,
            isActive: true,
        },
    });
}

/**
 * Update variant schema
 */
export async function updateVariantSchema(
    id: string,
    data: {
        name?: string;
        fields?: Prisma.InputJsonValue;
        isActive?: boolean;
    }
) {
    return await prisma.variantSchema.update({
        where: { id },
        data,
    });
}

/**
 * List variant schemas for a store
 */
export async function listVariantSchemas(storeId: string) {
    return await prisma.variantSchema.findMany({
        where: { storeId },
        orderBy: { version: 'desc' },
    });
}

/**
 * Deactivate all variant schemas for a store
 */
export async function deactivateVariantSchemas(storeId: string) {
    return await prisma.variantSchema.updateMany({
        where: { storeId },
        data: { isActive: false },
    });
}

/**
 * Activate a specific product schema version (deactivates others)
 */
export async function activateProductSchemaVersion(storeId: string, schemaId: string) {
    await deactivateProductSchemas(storeId);
    return await prisma.productSchema.update({
        where: {
            id: schemaId,
        },
        data: { isActive: true },
    });
}

/**
 * Activate a specific variant schema version (deactivates others)
 */
export async function activateVariantSchemaVersion(storeId: string, schemaId: string) {
    await deactivateVariantSchemas(storeId);
    return await prisma.variantSchema.update({
        where: {
            id: schemaId,
        },
        data: { isActive: true },
    });
}
