import * as categoryDal from '@/dal/category.dal';
import { requireStoreRole } from '@/lib/auth/requireStore';

export async function createCategory(
  userId: string,
  storeId: string,
  input: {
    name: string;
    slug: string;
    parentId?: string;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Category name is required');
  }

  if (!input.slug || input.slug.trim().length === 0) {
    throw new Error('Category slug is required');
  }

  // Slug validation (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (input.name.length > 100) {
    throw new Error('Category name must be 100 characters or less');
  }

  return categoryDal.createCategory(storeId, input);
}

export async function updateCategory(
  userId: string,
  storeId: string,
  categoryId: string,
  input: {
    name?: string;
    slug?: string;
    parentId?: string;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    if (input.name.length > 100) {
      throw new Error('Category name must be 100 characters or less');
    }
  }

  if (input.slug !== undefined) {
    if (input.slug.trim().length === 0) {
      throw new Error('Category slug cannot be empty');
    }
    if (!/^[a-z0-9-]+$/.test(input.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  return categoryDal.updateCategory(storeId, categoryId, input);
}

export async function deleteCategory(
  userId: string,
  storeId: string,
  categoryId: string
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  return categoryDal.deleteCategory(storeId, categoryId);
}

export async function listCategories(storeId: string) {
  // Public read access
  return categoryDal.listCategories(storeId);
}

export async function getCategoryTree(storeId: string) {
  // Public read access
  return categoryDal.getCategoryTree(storeId);
}

export async function getCategory(storeId: string, categoryId: string) {
  // Public read access
  return categoryDal.getCategoryById(storeId, categoryId);
}