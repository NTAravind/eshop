import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as paymentConfigService from '@/services/paymentConfig.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payment-configs
 * Create payment provider configuration
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // Payment configs can only be managed via session (not API keys)
    if (tenant.apiKeyId) {
      return NextResponse.json(
        { error: 'Payment configurations cannot be managed via API keys' },
        { status: 403 }
      );
    }

    if (!tenant.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const config = await paymentConfigService.createPaymentConfig(
      tenant.userId,
      tenant.storeId,
      {
        provider: body.provider,
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        webhookSecret: body.webhookSecret,
        isLive: body.isLive ?? false,
      }
    );

    return NextResponse.json(config, { status: 201 });
  } catch (error: any) {
    console.error('Create payment config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment configuration' },
      { status: error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * GET /api/payment-configs
 * List all payment configurations for store
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // Payment configs can only be viewed via session
    if (tenant.apiKeyId) {
      return NextResponse.json(
        { error: 'Payment configurations cannot be accessed via API keys' },
        { status: 403 }
      );
    }

    if (!tenant.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    const configs = await paymentConfigService.listPaymentConfigs(
      tenant.userId,
      tenant.storeId
    );

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('List payment configs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list payment configurations' },
      { status: error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (POST - Stripe):
 * {
 *   "provider": "STRIPE",
 *   "apiKey": "sk_live_51A...",
 *   "webhookSecret": "whsec_...",
 *   "isLive": true
 * }
 * 
 * Example Request (POST - Razorpay):
 * {
 *   "provider": "RAZORPAY",
 *   "apiKey": "rzp_live_...",
 *   "apiSecret": "...",
 *   "isLive": true
 * }
 * 
 * Example Request (POST - Manual):
 * {
 *   "provider": "MANUAL",
 *   "apiKey": "manual-payment-tracking-id",
 *   "isLive": true
 * }
 * 
 * Example Response (POST):
 * {
 *   "id": "pc_abc123",
 *   "storeId": "store_123",
 *   "provider": "STRIPE",
 *   "isLive": true,
 *   "isActive": true,
 *   "createdAt": "2026-01-06T10:30:00.000Z",
 *   "updatedAt": "2026-01-06T10:30:00.000Z"
 * }
 * 
 * Example Response (GET):
 * {
 *   "configs": [
 *     {
 *       "id": "pc_abc123",
 *       "provider": "STRIPE",
 *       "isLive": true,
 *       "isActive": true,
 *       "createdAt": "2026-01-06T10:30:00.000Z",
 *       "updatedAt": "2026-01-06T10:30:00.000Z"
 *     },
 *     {
 *       "id": "pc_def456",
 *       "provider": "RAZORPAY",
 *       "isLive": false,
 *       "isActive": true,
 *       "createdAt": "2026-01-05T14:20:00.000Z",
 *       "updatedAt": "2026-01-05T14:20:00.000Z"
 *     }
 *   ]
 * }
 */