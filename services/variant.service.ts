import * as variantDal from '@/dal/variant.dal';
import { getUserStoreRole } from '@/dal/store.dal';
import { indexVariantFacets } from './facet-sync.service';

/**
 * Create a variant for a product
 */
export async function createVariant(
    userId: string,
    storeId: string,
    productId: string,
    data: {
        sku: string;
        price: number;
        stock: number;
        customData?: Record<string, any>;
        isActive?: boolean;
    }
) {
    // Verify user has access to store
    const role = await getUserStoreRole(userId, storeId);
    if (!role) {
        throw new Error('Unauthorized access to store');
    }

    const variant = await variantDal.createVariant(productId, data);

    if (data.customData) {
        await indexVariantFacets(variant.id);
    }

    return variant;
}

/**
 * Update a variant
 */
export async function updateVariant(
    userId: string,
    storeId: string,
    variantId: string,
    data: {
        sku?: string;
        price?: number;
        stock?: number;
        customData?: Record<string, any>;
        isActive?: boolean;
    }
) {
    // Verify user has access to store
    const role = await getUserStoreRole(userId, storeId);
    if (!role) {
        throw new Error('Unauthorized access to store');
    }

    const variant = await variantDal.updateVariant(variantId, data);

    if (data.customData) {
        await indexVariantFacets(variant.id);
    }

    return variant;
}

/**
 * Delete a variant
 */
export async function deleteVariant(
    userId: string,
    storeId: string,
    variantId: string
) {
    // Verify user has access to store
    const role = await getUserStoreRole(userId, storeId);
    if (!role) {
        throw new Error('Unauthorized access to store');
    }

    return variantDal.deleteVariant(variantId);
}

/**
 * Get variant by ID
 */
export async function getVariant(storeId: string, variantId: string) {
    return variantDal.getVariantById(variantId);
}

/**
 * Get variant by SKU
 */
export async function getVariantBySku(storeId: string, sku: string) {
    return variantDal.getVariantBySku(sku);
}

/**
 * List variants for a product
 */
export async function listVariants(storeId: string, productId: string) {
    return variantDal.listVariantsByProduct(productId);
}

/**
 * Update variant stock
 */
export async function updateVariantStock(
    userId: string,
    storeId: string,
    variantId: string,
    stock: number
) {
    // Verify user has access to store
    const role = await getUserStoreRole(userId, storeId);
    if (!role) {
        throw new Error('Unauthorized access to store');
    }

    return variantDal.updateVariantStock(variantId, stock);
}

/**
 * Update variant customData with validation
 */
export async function updateVariantCustomData(
    userId: string,
    storeId: string,
    variantId: string,
    customData: Record<string, any>
) {
    // Verify user has access to store
    const role = await getUserStoreRole(userId, storeId);
    if (!role) {
        throw new Error('Unauthorized access to store');
    }

    // TODO: Validate customData against active VariantSchema
    // const activeSchema = await getActiveVariantSchema(storeId);
    // if (activeSchema) {
    //   const validation = validateCustomData(customData, activeSchema.fields as SchemaDefinition, 'admin');
    //   if (!validation.valid) {
    //     throw new Error(`Invalid customData: ${validation.errors.map(e => e.message).join(', ')}`);
    //   }
    // }

    const variant = await variantDal.updateVariantCustomData(variantId, customData);

    await indexVariantFacets(variant.id);

    return variant;
}
