import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefront } from '@/lib/tenant/resolveStorefront';
import * as productService from '@/services/product.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * List products with filters
 */
export async function GET(req: NextRequest) {
  try {
    const { storeId } = await resolveStorefront();

    const { searchParams } = new URL(req.url);

    const filters = {
      categoryId: searchParams.get('categoryId') || undefined,
      isActive: true, // Customers should only see active products
      search: searchParams.get('search') || undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
    };

    const result = await productService.listProducts(storeId, filters);

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
 * Example Request (GET):
 * GET /api/products?categoryId=cat_abc123&skip=0&take=20
 * 
 * Example Response (GET):
 * {
 *   "products": [{...}, {...}],
 *   "total": 45
 * }
 */