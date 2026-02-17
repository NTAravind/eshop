import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/facets/[id]/values
 * Deprecated: Facet values are automatically generated from Product/Variant data.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Manual facet value creation is deprecated. Values are generated from Product/Variant data.' },
    { status: 400 }
  );
}