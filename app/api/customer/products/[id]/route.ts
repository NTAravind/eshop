import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefront } from '@/lib/tenant/resolveStorefront';
import * as productService from '@/services/product.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]
 * Get single product by ID
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { storeId } = await resolveStorefront();

    const product = await productService.getProduct(storeId, params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get product' },
      { status: 400 }
    );
  }
}

/**
 * Example Response (GET):
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
 */