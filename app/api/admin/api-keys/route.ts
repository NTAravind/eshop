import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as apiKeyService from '@/services/apiKey.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/api-keys
 * Generate a new API key (OWNER only)
 */
export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // API keys cannot create other API keys
    if (tenant.apiKeyId) {
      return NextResponse.json(
        { error: 'API keys cannot create other API keys' },
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

    const apiKey = await apiKeyService.generateKey(
      tenant.userId,
      tenant.storeId,
      {
        name: body.name,
        scopes: body.scopes,
      }
    );

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error: any) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: error.message?.includes('denied') || error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * GET /api/api-keys
 * List all API keys for the store (OWNER only)
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant();

    // API keys cannot list other API keys
    if (tenant.apiKeyId) {
      return NextResponse.json(
        { error: 'API keys cannot list other API keys' },
        { status: 403 }
      );
    }

    if (!tenant.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 403 }
      );
    }

    const apiKeys = await apiKeyService.listKeys(tenant.userId, tenant.storeId);

    return NextResponse.json({ apiKeys });
  } catch (error: any) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list API keys' },
      { status: error.message?.includes('denied') || error.message?.includes('Only') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (POST):
 * {
 *   "name": "Production API Key",
 *   "scopes": ["products:read", "products:write", "orders:read"]
 * }
 * 
 * Example Response (POST):
 * {
 *   "id": "apikey_abc123",
 *   "keyId": "a1b2c3d4e5f6...",
 *   "storeId": "store_123",
 *   "name": "Production API Key",
 *   "scopes": ["products:read", "products:write", "orders:read"],
 *   "revokedAt": null,
 *   "lastUsedAt": null,
 *   "createdAt": "2026-01-06T10:30:00Z",
 *   "fullKey": "sk_live_a1b2c3d4e5f6..._7g8h9i0j1k2l..."
 * }
 * 
 * IMPORTANT: The "fullKey" is only returned once during creation.
 * Store it securely - it cannot be retrieved again.
 * 
 * Example Response (GET):
 * {
 *   "apiKeys": [
 *     {
 *       "id": "apikey_abc123",
 *       "keyId": "a1b2c3d4e5f6...",
 *       "name": "Production API Key",
 *       "scopes": ["products:read", "products:write"],
 *       "revokedAt": null,
 *       "lastUsedAt": "2026-01-06T09:15:00Z",
 *       "createdAt": "2026-01-05T14:20:00Z"
 *     }
 *   ]
 * }
 */