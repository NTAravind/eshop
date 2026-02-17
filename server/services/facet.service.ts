import * as facetDal from "@/server/dal/facet.dal";
import * as facetSync from "@/server/services/facet-sync.service";
import db from "@/server/db/prisma";

export async function getFacets(storeId: string) {
    return await facetDal.listFacets(storeId);
}

export async function deleteFacet(storeId: string, facetId: string) {
    const facet = await facetDal.findFacetById(facetId);
    if (!facet) {
        throw new Error("Facet not found");
    }
    if (facet.storeId !== storeId) {
        throw new Error("Access denied");
    }
    return await facetDal.deleteFacet(facetId);
}

export async function syncAllFacets(storeId: string) {
    // Fetch all product schemas
    const productSchemas = await db.productSchema.findMany({
        where: { storeId: storeId },
    });

    for (const schema of productSchemas) {
        await facetSync.syncFacetsFromSchema(
            storeId,
            schema.id,
            "PRODUCT",
            schema.fields as any
        );
    }

    // TODO: Sync variant facets if we have a way to fetch variant schemas or distinct fields
    // For now concentrating on Product Schemas as they are the primary source
}

