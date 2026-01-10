import * as variantDal from '@/dal/varient.dal';
import { requireStoreRole } from '@/lib/auth/requireStore';

export async function createVariant(
  userId: string,
  storeId: string,
  productId: string,
  input: {
    sku: string;
    price: number;
    stock: number;
    isActive?: boolean;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (!input.sku || input.sku.trim().length === 0) {
    throw new Error('SKU is required');
  }

  if (input.price < 0) {
    throw new Error('Price must be non-negative');
  }

  if (input.stock < 0) {
    throw new Error('Stock must be non-negative');
  }

  if (!Number.isInteger(input.price)) {
    throw new Error('Price must be in smallest currency unit (e.g., paise)');
  }

  if (!Number.isInteger(input.stock)) {
    throw new Error('Stock must be a whole number');
  }

  return variantDal.createVariant(storeId, productId, input);
}

export async function updateVariant(
  userId: string,
  storeId: string,
  variantId: string,
  input: {
    sku?: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (input.sku !== undefined && input.sku.trim().length === 0) {
    throw new Error('SKU cannot be empty');
  }

  if (input.price !== undefined) {
    if (input.price < 0) {
      throw new Error('Price must be non-negative');
    }
    if (!Number.isInteger(input.price)) {
      throw new Error('Price must be in smallest currency unit');
    }
  }

  if (input.stock !== undefined) {
    if (input.stock < 0) {
      throw new Error('Stock must be non-negative');
    }
    if (!Number.isInteger(input.stock)) {
      throw new Error('Stock must be a whole number');
    }
  }

  return variantDal.updateVariant(storeId, variantId, input);
}

export async function deleteVariant(
  userId: string,
  storeId: string,
  variantId: string
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  return variantDal.deleteVariant(storeId, variantId);
}

/**
 * Atomic stock update with validation.
 * Used for reserving/releasing inventory.
 */
export async function updateStock(
  userId: string,
  storeId: string,
  variantId: string,
  delta: number
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (!Number.isInteger(delta)) {
    throw new Error('Stock delta must be a whole number');
  }

  if (delta === 0) {
    throw new Error('Stock delta cannot be zero');
  }

  return variantDal.updateStockAtomic(storeId, variantId, delta);
}

export async function getVariant(storeId: string, variantId: string) {
  // Read access - no permission check needed
  return variantDal.getVariantById(storeId, variantId);
}

export async function attachFacetsToVariant(
  userId: string,
  storeId: string,
  variantId: string,
  facetValueIds: string[]
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  return variantDal.attachFacetValuesToVariant(storeId, variantId, facetValueIds);
}