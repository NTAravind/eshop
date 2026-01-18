import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as paymentConfigService from '@/services/paymentConfig.service';

/**
 * GET /api/payment-configs/[id]
 * Get single payment configuration
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const tenant = await resolveTenant();

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

    const config = await paymentConfigService.getPaymentConfig(
      tenant.userId,
      tenant.storeId,
      params.id
    );

    if (!config) {
      return NextResponse.json(
        { error: 'Payment configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Get payment config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment configuration' },
      { status: error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * PATCH /api/payment-configs/[id]
 * Update payment configuration
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const tenant = await resolveTenant();

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

    const config = await paymentConfigService.updatePaymentConfig(
      tenant.userId,
      tenant.storeId,
      params.id,
      {
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        webhookSecret: body.webhookSecret,
        isLive: body.isLive,
        isActive: body.isActive,
      }
    );

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Update payment config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment configuration' },
      { status: error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * DELETE /api/payment-configs/[id]
 * Delete payment configuration
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const tenant = await resolveTenant();

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

    await paymentConfigService.deletePaymentConfig(
      tenant.userId,
      tenant.storeId,
      params.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete payment config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment configuration' },
      { status: error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (PATCH):
 * {
 *   "apiKey": "sk_live_new_key...",
 *   "webhookSecret": "whsec_new_secret...",
 *   "isActive": false
 * }
 * 
 * Example Response (PATCH):
 * {
 *   "id": "pc_abc123",
 *   "storeId": "store_123",
 *   "provider": "STRIPE",
 *   "isLive": true,
 *   "isActive": false,
 *   "createdAt": "2026-01-06T10:30:00.000Z",
 *   "updatedAt": "2026-01-06T11:45:00.000Z"
 * }
 * 
 * Example Response (DELETE):
 * {
 *   "success": true
 * }
 */