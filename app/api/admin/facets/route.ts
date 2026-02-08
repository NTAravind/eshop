import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as facetDal from '@/dal/facet.dal';

export const dynamic = 'force-dynamic';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { hasWriteScope } from '@/services/apiKey.service';

/**
 * POST /api/facets
 * Create a new facet
 */
/**
 * POST /api/facets
 * Deprecated: Facets are now automatically generated from Product/Variant Schemas.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Manual facet creation is deprecated. Facets are generated from Product/Variant Schemas.' },
    { status: 400 }
  );
}

/**
 * GET /api/facets
 * List all facets with their values
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

    const facets = await facetDal.listFacets(tenant.storeId);

    return NextResponse.json({ facets });
  } catch (error: any) {
    console.error('List facets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list facets' },
      { status: 400 }
    );
  }
}

/**
 * Example Request (POST):
 * {
 *   "name": "Color",
 *   "code": "color"
 * }
 * 
 * Example Response (POST):
 * {
 *   "id": "facet_abc123",
 *   "storeId": "store_123",
 *   "name": "Color",
 *   "code": "color",
 *   "createdAt": "2026-01-06T10:30:00Z",
 *   "values": []
 * }
 * 
 * Example Response (GET):
 * {
 *   "facets": [
 *     {
 *       "id": "facet_abc123",
 *       "name": "Color",
 *       "code": "color",
 *       "values": [
 *         { "id": "fv_123", "value": "Red" },
 *         { "id": "fv_124", "value": "Blue" }
 *       ]
 *     }
 *   ]
 * }
 */