import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefront } from '@/lib/tenant/resolveStorefront';
import * as orderService from '@/services/order.service';
import { OrderStatus } from '@/app/generated/prisma';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 * List orders
 */
export async function GET(req: NextRequest) {
  try {
    const { storeId, userId } = await resolveStorefront();

    if (!userId) {
      // Guests cannot list orders yet (unless we track by session, but typical ecom requires login for order history)
      return NextResponse.json(
        { error: 'User authentication required to view order history' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const filters = {
      userId: userId, // Enforce the logged-in user's ID
      status: searchParams.get('status') as OrderStatus | undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
    };

    const result = await orderService.listOrders(
      userId,
      storeId,
      filters
    );

    return NextResponse.json(result);
  } catch (error: any) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error, details: errorResponse.details },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * Example Request (GET):
 * GET /api/orders?status=PENDING&skip=0&take=20
 * 
 * Example Response (GET):
 * {
 *   "results": [...],
 *   "total": 5
 * }
 */