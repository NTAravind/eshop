import * as productDal from '@/dal/product.dal';
import * as subscriptionDal from '@/dal/subscription.dal';
import * as usageService from '@/services/usage.service';
import { requireStoreRole } from '@/lib/auth/requireStore';

export async function createProduct(
  userId: string,
  storeId: string,
  input: {
    name: string;
    description?: string;
    categoryId?: string;
    productSchemaId?: string;
    customData?: Record<string, any>;
    isActive?: boolean;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // GET ACCOUNT FROM STORE
  const account = await subscriptionDal.getAccountByStoreId(storeId);
  if (!account) {
    throw new Error('Store does not belong to any account');
  }

  // ENFORCE PRODUCT LIMIT (account-wide)
  await usageService.checkProductLimit(account.id);

  // Validation
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Product name is required');
  }

  if (input.name.length > 200) {
    throw new Error('Product name must be 200 characters or less');
  }

  const product = await productDal.createProduct(storeId, input);

  // RECORD PRODUCT CREATION
  await usageService.recordProductCreation(account.id);

  return product;
}

export async function updateProduct(
  userId: string,
  storeId: string,
  productId: string,
  input: {
    name?: string;
    description?: string;
    categoryId?: string;
    productSchemaId?: string;
    customData?: Record<string, any>;
    isActive?: boolean;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }
    if (input.name.length > 200) {
      throw new Error('Product name must be 200 characters or less');
    }
  }

  return productDal.updateProduct(storeId, productId, input);
}

export async function deleteProduct(
  userId: string,
  storeId: string,
  productId: string
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  const product = await productDal.deleteProduct(storeId, productId);

  // GET ACCOUNT FROM STORE
  const account = await subscriptionDal.getAccountByStoreId(storeId);
  if (account) {
    // RECORD PRODUCT DELETION
    await usageService.recordProductDeletion(account.id);
  }

  return product;
}

export async function getProduct(storeId: string, productId: string) {
  // Read access - no permission check needed (public API)
  return productDal.getProductById(storeId, productId);
}

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
  // Read access - no permission check needed (public API)

  // Validation
  const take = filters?.take ?? 50;
  if (take > 100) {
    throw new Error('Maximum 100 items per page');
  }

  return productDal.listProducts(storeId, {
    ...filters,
    take,
  });
}

export async function attachCategoryToProduct(
  userId: string,
  storeId: string,
  productId: string,
  categoryId: string | null
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  return productDal.attachCategory(storeId, productId, categoryId);
}
