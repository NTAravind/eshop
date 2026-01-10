import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as discountService from '@/services/discount.service';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * GET /api/discounts/[id]
 * Get single discount
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await resolveTenant();

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
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    const discount = await discountService.getDiscount(
      tenant.userId,
      tenant.storeId,
      params.id
    );

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(discount);
  } catch (error: any) {
    console.error('Get discount error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get discount' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * PATCH /api/discounts/[id]
 * Update discount
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await resolveTenant();

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
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const discount = await discountService.updateDiscount(
      tenant.userId,
      tenant.storeId,
      params.id,
      {
        code: body.code,
        name: body.name,
        description: body.description,
        value: body.value,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        maxUsageCount: body.maxUsageCount,
        maxUsagePerUser: body.maxUsagePerUser,
        minOrderValue: body.minOrderValue,
        isStackable: body.isStackable,
        isActive: body.isActive,
        productIds: body.productIds,
        categoryIds: body.categoryIds,
      }
    );

    return NextResponse.json(discount);
  } catch (error: any) {
    console.error('Update discount error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update discount' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * DELETE /api/discounts/[id]
 * Delete discount
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await resolveTenant();

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
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    await discountService.deleteDiscount(
      tenant.userId,
      tenant.storeId,
      params.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete discount error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete discount' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}