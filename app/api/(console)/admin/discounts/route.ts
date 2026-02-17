import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as discountService from '@/services/discount.service';
import { hasWriteScope } from '@/services/apiKey.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/discounts
 * Create a new discount
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // Check API key scopes
    if (tenant.apiKeyId && tenant.scopes) {
      if (!hasWriteScope(tenant.scopes, 'discounts')) {
        return NextResponse.json(
          { error: 'Missing required scope: discounts:write' },
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

    const discount = await discountService.createDiscount(
      tenant.userId,
      tenant.storeId,
      {
        code: body.code,
        name: body.name,
        description: body.description,
        type: body.type,
        value: body.value,
        scope: body.scope,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        maxUsageCount: body.maxUsageCount,
        maxUsagePerUser: body.maxUsagePerUser,
        minOrderValue: body.minOrderValue,
        isStackable: body.isStackable,
        productIds: body.productIds,
        categoryIds: body.categoryIds,
      }
    );

    return NextResponse.json(discount, { status: 201 });
  } catch (error: any) {
    console.error('Create discount error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create discount' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * GET /api/discounts
 * List discounts
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // Check API key scopes
    if (tenant.apiKeyId && tenant.scopes) {
      const hasRead = tenant.scopes.includes('*') || tenant.scopes.includes('discounts:read');
      if (!hasRead) {
        return NextResponse.json(
          { error: 'Missing required scope: discounts:read' },
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

    const { searchParams } = new URL(req.url);

    const filters = {
      isActive: searchParams.get('isActive') === 'true' ? true :
        searchParams.get('isActive') === 'false' ? false : undefined,
      scope: searchParams.get('scope') as any,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
    };

    const result = await discountService.listDiscounts(
      tenant.userId,
      tenant.storeId,
      filters
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('List discounts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list discounts' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (POST - Percentage Store-wide):
 * {
 *   "code": "SUMMER10",
 *   "name": "Summer Sale",
 *   "description": "10% off everything",
 *   "type": "PERCENTAGE",
 *   "value": 1000,
 *   "scope": "STORE_WIDE",
 *   "startsAt": "2026-06-01T00:00:00Z",
 *   "endsAt": "2026-08-31T23:59:59Z",
 *   "maxUsageCount": 1000,
 *   "maxUsagePerUser": 1,
 *   "minOrderValue": 100000,
 *   "isStackable": false
 * }
 * 
 * Example Request (POST - Fixed Amount Product-specific):
 * {
 *   "code": "JACKET200",
 *   "name": "₹200 off Jackets",
 *   "type": "FIXED_AMOUNT",
 *   "value": 20000,
 *   "scope": "PRODUCT",
 *   "startsAt": "2026-01-01T00:00:00Z",
 *   "endsAt": "2026-12-31T23:59:59Z",
 *   "productIds": ["prod_abc123", "prod_def456"],
 *   "isStackable": true
 * }
 */