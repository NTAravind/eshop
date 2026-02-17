import db from "@/lib/prisma";
import { SchemaType } from "@/app/generated/prisma";

export async function findFacet(storeId: string, code: string, schemaType: SchemaType) {
    return await db.facet.findUnique({
        where: {
            storeId_code_schemaType: {
                storeId,
                code,
                schemaType,
            },
        },
    });
}

export async function createFacet(data: {
    storeId: string;
    name: string;
    code: string;
    schemaFieldName: string;
    schemaType: SchemaType;
    productSchemaId?: string;
    variantSchemaId?: string;
}) {
    return await db.facet.create({
        data: {
            storeId: data.storeId,
            name: data.name,
            code: data.code,
            schemaFieldName: data.schemaFieldName,
            schemaType: data.schemaType,
            productSchemaId: data.productSchemaId,
            variantSchemaId: data.variantSchemaId,
        },
    });
}

export async function ensureFacetValue(facetId: string, value: string) {
    // Try to find existing first
    const existing = await db.facetValue.findUnique({
        where: {
            facetId_value: {
                facetId,
                value,
            },
        },
    });

    if (existing) return existing;

    // Create if not exists
    return await db.facetValue.create({
        data: {
            facetId,
            value,
        },
    });
}

export async function replaceProductFacetValues(productId: string, facetValueIds: string[]) {
    // Transaction to delete old and add new
    return await db.$transaction(async (tx) => {
        // 1. Delete all existing facet links for this product
        // Note: We might want to be more selective if we only want to update specific facets,
        // but full replacement is safer for sync logic
        await tx.productFacetValue.deleteMany({
            where: { productId },
        });

        // 2. Create new links if there are any
        if (facetValueIds.length > 0) {
            // We need to fetch the facetId for each facetValueId to populate the link table correctly
            const facetValues = await tx.facetValue.findMany({
                where: { id: { in: facetValueIds } },
                select: { id: true, facetId: true }
            });

            const data = facetValues.map(fv => ({
                productId,
                facetId: fv.facetId,
                facetValueId: fv.id
            }));

            await tx.productFacetValue.createMany({
                data,
            });
        }
    });
}

export async function replaceVariantFacetValues(variantId: string, facetValueIds: string[]) {
    return await db.$transaction(async (tx) => {
        await tx.variantFacetValue.deleteMany({
            where: { variantId },
        });

        if (facetValueIds.length > 0) {
            const facetValues = await tx.facetValue.findMany({
                where: { id: { in: facetValueIds } },
                select: { id: true, facetId: true }
            });

            const data = facetValues.map(fv => ({
                variantId,
                facetId: fv.facetId,
                facetValueId: fv.id
            }));

            await tx.variantFacetValue.createMany({
                data,
            });
        }
    });
}

export async function listFacets(storeId: string) {
    return await db.facet.findMany({
        where: { storeId },
        include: {
            values: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function deleteFacet(facetId: string) {
    return await db.facet.delete({
        where: { id: facetId },
    });
}
