import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as productService from '@/services/product.service';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // If using API key, check scopes
    if (tenant.apiKeyId && tenant.scopes) {
      if (!hasWriteScope(tenant.scopes, 'products')) {
        return NextResponse.json(
          { error: 'Missing required scope: products:write' },
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

    const body = await req.json();

    const product = await productService.createProduct(
      tenant.userId,
      tenant.storeId,
      {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        isActive: body.isActive,
      }
    );

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * GET /api/products
 * List products with filters
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // If using API key, check scopes
    if (tenant.apiKeyId && tenant.scopes) {
      const hasRead = tenant.scopes.includes('*') || tenant.scopes.includes('products:read');
      if (!hasRead) {
        return NextResponse.json(
          { error: 'Missing required scope: products:read' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    
    const filters = {
      categoryId: searchParams.get('categoryId') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
    };

    const result = await productService.listProducts(tenant.storeId, filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('List products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list products' },
      { status: 400 }
    );
  }
}

/**
 * Example Request (POST):
 * {
 *   "name": "Premium Leather Jacket",
 *   "description": "High-quality leather jacket",
 *   "categoryId": "cat_abc123",
 *   "isActive": true
 * }
 * 
 * Example Response (POST):
 * {
 *   "id": "prod_xyz789",
 *   "storeId": "store_123",
 *   "name": "Premium Leather Jacket",
 *   "description": "High-quality leather jacket",
 *   "categoryId": "cat_abc123",
 *   "isActive": true,
 *   "createdAt": "2026-01-06T10:30:00Z",
 *   "category": {...},
 *   "variants": [],
 *   "images": []
 * }
 * 
 * Example Request (GET):
 * GET /api/products?categoryId=cat_abc123&isActive=true&skip=0&take=20
 * 
 * Example Response (GET):
 * {
 *   "products": [{...}, {...}],
 *   "total": 45
 * }
 */