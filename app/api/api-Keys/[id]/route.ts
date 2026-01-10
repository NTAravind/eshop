import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as apiKeyService from '@/services/apiKey.service';

/**
 * DELETE /api/api-keys/[id]
 * Revoke an API key (OWNER only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await resolveTenant();

    // API keys cannot revoke other API keys
    if (tenant.apiKeyId) {
      return NextResponse.json(
        { error: 'API keys cannot revoke other API keys' },
        { status: 403 }
      );
    }

    if (!tenant.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    await apiKeyService.revokeKey(tenant.userId, tenant.storeId, params.id);

    return NextResponse.json({ success: true, revoked: true });
  } catch (error: any) {
    console.error('Revoke API key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status: error.message?.includes('denied') || error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * Example Response:
 * {
 *   "success": true,
 *   "revoked": true
 * }
 */