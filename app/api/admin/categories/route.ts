import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as categoryDal from '@/dal/category.dal';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // If using API key, check scopes
    if (tenant.apiKeyId && tenant.scopes) {
      if (!hasWriteScope(tenant.scopes, 'categories')) {
        return NextResponse.json(
          { error: 'Missing required scope: categories:write' },
          { status: 403 }
        );
      }
    }

    if (!tenant.userId) {
      return NextResponse.json(
        { error: 'User authentication required for this operation' },
        { status: 403 }
      );
    }

    // Permission check
    await requireStoreRole(tenant.userId, tenant.storeId, 'MANAGER');

    const body = await req.json();

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!body.slug || body.slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category slug is required' },
        { status: 400 }
      );
    }

    const category = await categoryDal.createCategory(tenant.storeId, {
      name: body.name,
      slug: body.slug,
      parentId: body.parentId,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * GET /api/categories
 * List all categories (with tree structure)
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // If using API key, check scopes
    if (tenant.apiKeyId && tenant.scopes) {
      const hasRead = tenant.scopes.includes('*') || tenant.scopes.includes('categories:read');
      if (!hasRead) {
        return NextResponse.json(
          { error: 'Missing required scope: categories:read' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const tree = searchParams.get('tree') === 'true';

    const categories = tree 
      ? await categoryDal.getCategoryTree(tenant.storeId)
      : await categoryDal.listCategories(tenant.storeId);

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('List categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list categories' },
      { status: 400 }
    );
  }
}

/**
 * Example Request (POST):
 * {
 *   "name": "Men's Clothing",
 *   "slug": "mens-clothing",
 *   "parentId": null
 * }
 * 
 * Example Response (POST):
 * {
 *   "id": "cat_abc123",
 *   "storeId": "store_123",
 *   "name": "Men's Clothing",
 *   "slug": "mens-clothing",
 *   "parentId": null,
 *   "createdAt": "2026-01-06T10:30:00Z",
 *   "parent": null,
 *   "children": []
 * }
 * 
 * Example Request (GET):
 * GET /api/categories?tree=true
 * 
 * Example Response (GET):
 * {
 *   "categories": [
 *     {
 *       "id": "cat_abc123",
 *       "name": "Men's Clothing",
 *       "slug": "mens-clothing",
 *       "children": [
 *         {
 *           "id": "cat_def456",
 *           "name": "Jackets",
 *           "slug": "jackets",
 *           "children": []
 *         }
 *       ]
 *     }
 *   ]
 * }
 */11