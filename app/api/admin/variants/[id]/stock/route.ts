import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as variantService from '@/services/varient.service';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * PATCH /api/variants/[id]/stock
 * Atomically update variant stock
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    if (body.delta === undefined) {
      return NextResponse.json(
        { error: 'delta is required' },
        { status: 400 }
      );
    }

    const variant = await variantService.updateStock(
      tenant.userId,
      tenant.storeId,
      params.id,
      body.delta
    );

    return NextResponse.json(variant);
  } catch (error: any) {
    console.error('Update stock error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update stock' },
      { status: error.message?.includes('denied') || error.message?.includes('Insufficient') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (Increase stock):
 * {
 *   "delta": 20
 * }
 * 
 * Example Request (Decrease stock):
 * {
 *   "delta": -5
 * }
 * 
 * Example Response:
 * {
 *   "id": "var_abc123",
 *   "sku": "JACKET-BLK-L",
 *   "price": 14999,
 *   "stock": 65,
 *   "isActive": true
 * }
 */