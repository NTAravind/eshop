import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefront } from '@/lib/tenant/resolveStorefront';
import * as facetDal from '@/dal/facet.dal';

export const dynamic = 'force-dynamic';

/**
 * GET /api/facets
 * List all facets with their values
 */
export async function GET(req: NextRequest) {
  try {
    const { storeId } = await resolveStorefront();

    const facets = await facetDal.listFacets(storeId);

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