import prisma from '@/lib/prisma';
import { ProductSchema, SchemaType } from '@/app/generated/prisma';
import { syncFacetsFromSchema } from './facet-sync.service';

export interface SchemaField {
    name: string; // Changed key to name to match new logic, or map key -> name
    key: string;  // Maintaining key for compatibility but prefer name
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'date';
    required: boolean;
    isFilterable?: boolean;
    options?: string[]; // For select type
}

export async function getActiveSchema(storeId: string): Promise<ProductSchema | null> {
    return prisma.productSchema.findFirst({
        where: {
            storeId,
            isActive: true,
        },
        orderBy: {
            version: 'desc',
        },
    });
}

export async function getSchemaById(id: string): Promise<ProductSchema | null> {
    return prisma.productSchema.findUnique({
        where: { id },
    });
}

export async function listActiveSchemas(storeId: string): Promise<ProductSchema[]> {
    return prisma.productSchema.findMany({
        where: {
            storeId,
            isActive: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createSchema(storeId: string, name: string, fields: SchemaField[]) {
    // Get last version for THIS specific schema name
    const lastSchema = await prisma.productSchema.findFirst({
        where: { storeId, name },
        orderBy: { version: 'desc' },
    });

    const version = (lastSchema?.version || 0) + 1;

    // Do NOT deactivate previous schemas. We want multiple active types.
    // However, if we are creating a new version of an EXISTING type (same name), 
    // we SHOULD deactivate the old version of THAT type.

    if (lastSchema) {
        await prisma.productSchema.update({
            where: { id: lastSchema.id },
            data: { isActive: false }
        });
    }

    const schema = await prisma.productSchema.create({
        data: {
            storeId,
            name,
            version,
            fields: fields as any, // Json type
            isActive: true, // Always active by default
        },
    });

    // Sync facets
    await syncFacetsFromSchema(storeId, schema.id, 'PRODUCT', fields as any);

    return schema;
}

export async function listSchemas(storeId: string) {
    return prisma.productSchema.findMany({
        where: { storeId },
        orderBy: { version: 'desc' },
    });
}

export async function updateSchema(id: string, storeId: string, data: Partial<ProductSchema>) {
    const { id: _, storeId: __, createdAt, updatedAt, ...updateData } = data;
    const schema = await prisma.productSchema.update({
        where: { id },
        data: updateData as any,
    });

    if (updateData.fields) {
        await syncFacetsFromSchema(storeId, schema.id, 'PRODUCT', updateData.fields as any);
    }

    return schema;
}
