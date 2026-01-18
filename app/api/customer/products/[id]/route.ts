import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as productService from '@/services/product.service';
import { hasWriteScope } from '@/services/apiKey.service';

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

    const product = await productService.getProduct(tenant.storeId, params.id);

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
 * PATCH /api/products/[id]
 * Update product
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

    const product = await productService.updateProduct(
      tenant.userId,
      tenant.storeId,
      params.id,
      {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        isActive: body.isActive,
      }
    );

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Delete product
 */
export async function DELETE(
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

    await productService.deleteProduct(tenant.userId, tenant.storeId, params.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (PATCH):
 * {
 *   "name": "Updated Product Name",
 *   "isActive": false
 * }
 * 
 * Example Response (PATCH):
 * {
 *   "id": "prod_xyz789",
 *   "name": "Updated Product Name",
 *   "isActive": false,
 *   ...
 * }
 */