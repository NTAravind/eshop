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

    // Permission check
    await requireStoreRole(tenant.userId, tenant.storeId, 'MANAGER');

    const body = await req.json();

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Facet name is required' },
        { status: 400 }
      );
    }

    if (!body.code || body.code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Facet code is required' },
        { status: 400 }
      );
    }

    const facet = await facetDal.createFacet(tenant.storeId, {
      name: body.name,
      code: body.code,
    });

    return NextResponse.json(facet, { status: 201 });
  } catch (error: any) {
    console.error('Create facet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create facet' },
      { status: error.message?.includes('denied') ? 403 : 400 }
    );
  }
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