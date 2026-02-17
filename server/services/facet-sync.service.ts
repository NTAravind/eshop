import { SchemaType } from "@/app/generated/prisma";
import * as facetDal from "@/dal/facet.dal";
import db from "@/server/db/prisma";

interface SchemaField {
    key: string;
    type: string;
    label: string;
    isFilterable?: boolean;
    isRequired?: boolean;
    // name was used before, but actual data uses key
    name?: string;
}

/**
 * Ensures that facets exist for all filterable fields in the given schema.
 */
export async function syncFacetsFromSchema(
    storeId: string,
    schemaId: string,
    schemaType: SchemaType,
    fields: SchemaField[]
) {
    const filterableFields = fields.filter((f) => f.isFilterable);
    console.log(`[SYNC] Found ${filterableFields.length} filterable fields for schema ${schemaId}`, filterableFields);

    for (const field of filterableFields) {
        // Check if facet exists
        try {
            const code = field.key || field.name;
            if (!code) {
                console.warn(`[SYNC] Field missing key/name`, field);
                continue;
            }

            // Check if facet exists
            const existing = await facetDal.findFacet(storeId, code, schemaType);

            if (!existing) {
                console.log(`[SYNC] Creating facet for ${code}`);
                await facetDal.createFacet({
                    storeId,
                    name: field.label || code,
                    code,
                    schemaFieldName: code,
                    schemaType,
                    productSchemaId: schemaType === "PRODUCT" ? schemaId : undefined,
                    variantSchemaId: schemaType === "VARIANT" ? schemaId : undefined,
                });
            } else {
                console.log(`[SYNC] Facet exists for ${code}`);
            }
        } catch (err) {
            console.error(`[SYNC] Failed to process field ${field.key}`, err);
        }
    }
}

/**
 * Extracts filterable values from a product's customData and updates FacetValues and ProductFacetValue links.
 */
export async function indexProductFacets(productId: string) {
    const product = await db.product.findUnique({
        where: { id: productId },
        include: { productSchema: true },
    });

    if (!product || !product.productSchema || !product.customData) {
        // If no schema or no data, clear existing facet links
        await facetDal.replaceProductFacetValues(productId, []);
        return;
    }

    const schemaFields = product.productSchema.fields as unknown as SchemaField[];
    const customData = product.customData as Record<string, any>;
    const facetValueIds: string[] = [];

    for (const field of schemaFields) {
        if (!field.isFilterable) continue;

        const code = field.key || field.name;
        if (!code) continue;

        const value = customData[code];
        if (value === undefined || value === null || value === "") continue;

        const stringValue = String(value);

        // Find the facet for this field
        const facet = await facetDal.findFacet(product.storeId, code, "PRODUCT");
        if (!facet) {
            // Facet might be missing if schema wasn't synced. 
            // We could try to auto-create it here, or just skip. 
            // Skipping for now, assuming schema save triggers sync.
            continue;
        }

        // Ensure Value exists
        const facetValue = await facetDal.ensureFacetValue(facet.id, stringValue);
        facetValueIds.push(facetValue.id);
    }

    // Update links
    await facetDal.replaceProductFacetValues(productId, facetValueIds);
}

/**
 * Extracts filterable values from a variant's customData and updates FacetValues and VariantFacetValue links.
 */
export async function indexVariantFacets(variantId: string) {
    const variant = await db.productVariant.findUnique({
        where: { id: variantId },
        include: {
            product: {
                include: {
                    store: true
                }
            },
            // We need to fetch the variant schema. It's usually global or linked via logic, 
            // but current Prisma schema shows VariantSchema linked to Store, not directly to Variant.
            // Wait, where is the link?
            // Checking schema: VariantSchema is independent, looks like variants don't strictly link to a specific VariantSchema ID in the current model?
            // Ah, Product has `productSchemaId`. Variant doesn't have `variantSchemaId`.
            // Let's check `ProductVariant` model in schema.
            // It has `customData`.
            // `VariantSchema` is unique by `[storeId, version]`. 
            // We probably assume the default/active variant schema for the store, or we need to know which one applies.
            // For now, let's look for the Facet definitions by code + VARIANT type.
        }
    });

    if (!variant || !variant.customData) {
        await facetDal.replaceVariantFacetValues(variantId, []);
        return;
    }

    const customData = variant.customData as Record<string, any>;
    const storeId = variant.product.storeId;
    const facetValueIds: string[] = [];

    // Iterate over keys in customData to find matching facets
    // This is less efficient than iterating schema, but since we don't strictly know the schema ID on the variant,
    // we can look up facets by code (field name) + storeId + VARIANT type.

    for (const [key, value] of Object.entries(customData)) {
        if (value === undefined || value === null || value === "") continue;

        const facet = await facetDal.findFacet(storeId, key, "VARIANT");
        if (!facet) continue; // Not a filterable field (or facet not created)

        const stringValue = String(value);
        const facetValue = await facetDal.ensureFacetValue(facet.id, stringValue);
        facetValueIds.push(facetValue.id);
    }

    await facetDal.replaceVariantFacetValues(variantId, facetValueIds);
}
