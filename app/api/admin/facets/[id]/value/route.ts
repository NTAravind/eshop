import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as facetDal from '@/dal/facet.dal';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * POST /api/facets/[id]/values
 * Add a new value to a facet
 */
export async function POST(
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

    // Permission check
    await requireStoreRole(tenant.userId, tenant.storeId, 'MANAGER');

    const body = await req.json();

    // Validation
    if (!body.value || body.value.trim().length === 0) {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      );
    }

    const facetValue = await facetDal.createFacetValue(
      tenant.storeId,
      params.id,
      body.value
    );

    return NextResponse.json(facetValue, { status: 201 });
  } catch (error: any) {
    console.error('Create facet value error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create facet value' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
}

/**
 * Example Request:
 * {
 *   "value": "Navy Blue"
 * }
 * 
 * Example Response:
 * {
 *   "id": "fv_xyz789",
 *   "facetId": "facet_abc123",
 *   "value": "Navy Blue",
 *   "facet": {
 *     "id": "facet_abc123",
 *     "name": "Color",
 *     "code": "color"
 *   }
 * }
 */