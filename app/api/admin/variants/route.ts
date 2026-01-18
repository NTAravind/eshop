import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as variantService from '@/services/varient.service';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * POST /api/variants
 * Create a new variant
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

    if (!body.productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const variant = await variantService.createVariant(
      tenant.userId,
      tenant.storeId,
      body.productId,
      {
        sku: body.sku,
        price: body.price,
        stock: body.stock,
        isActive: body.isActive,
      }
    );

    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    console.error('Create variant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * Example Request:
 * {
 *   "productId": "prod_xyz789",
 *   "sku": "JACKET-BLK-L",
 *   "price": 14999,
 *   "stock": 50,
 *   "isActive": true
 * }
 * 
 * Example Response:
 * {
 *   "id": "var_abc123",
 *   "productId": "prod_xyz789",
 *   "sku": "JACKET-BLK-L",
 *   "price": 14999,
 *   "stock": 50,
 *   "isActive": true,
 *   "product": {...},
 *   "images": [],
 *   "facets": []
 * }
 */