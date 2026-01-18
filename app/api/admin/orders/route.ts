import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as orderService from '@/services/order.service';
import { hasWriteScope } from '@/services/apiKey.service';
import { OrderStatus } from '@/app/generated/prisma';
import { toErrorResponse } from '@/lib/errors';

/**
 * POST /api/orders
 * Create a new order with automatic discount calculation
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // Check API key scopes
    if (tenant.apiKeyId && tenant.scopes) {
      if (!hasWriteScope(tenant.scopes, 'orders')) {
        return NextResponse.json(
          { error: 'Missing required scope: orders:write' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();

    // CRITICAL: Never trust client-provided totals
    // All calculations happen server-side in orderService

    const order = await orderService.createOrder(
      tenant.storeId, 
      {
        userId: body.userId || tenant.userId,
        lines: body.lines,
        currency: body.currency,
      },
      body.couponCode // Optional coupon code
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error, details: errorResponse.details },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * GET /api/orders
 * List orders
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // Check API key scopes
    if (tenant.apiKeyId && tenant.scopes) {
      const hasRead = tenant.scopes.includes('*') || tenant.scopes.includes('orders:read');
      if (!hasRead) {
        return NextResponse.json(
          { error: 'Missing required scope: orders:read' },
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
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') as OrderStatus | undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
    };

    const result = await orderService.listOrders(
      tenant.userId,
      tenant.storeId,
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
 * Example Request (POST):
 * {
 *   "userId": "user_abc123",
 *   "lines": [
 *     {
 *       "variantId": "var_xyz789",
 *       "quantity": 2
 *     },
 *     {
 *       "variantId": "var_def456",
 *       "quantity": 1
 *     }
 *   ],
 *   "currency": "INR",
 *   "couponCode": "SUMMER10"
 * }
 * 
 * Example Response (POST - Success):
 * {
 *   "id": "order_abc123",
 *   "storeId": "store_123",
 *   "userId": "user_abc123",
 *   "subtotal": 44997,
 *   "discountAmount": 4500,
 *   "total": 40497,
 *   "currency": "INR",
 *   "status": "PENDING",
 *   "createdAt": "2026-01-06T10:30:00.000Z",
 *   "lines": [...],
 *   "discounts": [
 *     {
 *       "discountId": "disc_xyz",
 *       "amount": 4500,
 *       "discount": {
 *         "id": "disc_xyz",
 *         "code": "SUMMER10",
 *         "name": "Summer Sale",
 *         "type": "PERCENTAGE",
 *         "value": 1000
 *       }
 *     }
 *   ],
 *   "payments": []
 * }
 * 
 * Example Response (POST - Validation Error):
 * {
 *   "error": "Quantity must be positive",
 *   "details": {
 *     "field": "quantity"
 *   }
 * }
 * 
 * Example Response (POST - Usage Limit):
 * {
 *   "error": "Monthly order limit reached. Your Basic plan allows 100 orders per month.",
 *   "details": {
 *     "limit": 100,
 *     "current": 100,
 *     "resource": "orders"
 *   }
 * }
 * 
 * Example Response (POST - Insufficient Stock):
 * {
 *   "error": "Insufficient stock for JACKET-BLK-L. Available: 5, Requested: 10"
 * }
 */