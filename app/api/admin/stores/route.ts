import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as storeService from '@/services/store.service';

/**
 * POST /api/admin/stores
 * Create a new store
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        // Store creation requires user authentication (not API keys)
        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Store creation cannot be done via API keys' },
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

        const store = await storeService.createStore(tenant.userId, {
            name: body.name,
            slug: body.slug,
        });

        return NextResponse.json(store, { status: 201 });
    } catch (error: any) {
        console.error('Create store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create store' },
            { status: error.message?.includes('limit') || error.message?.includes('already') ? 400 : 500 }
        );
    }
}

/**
 * GET /api/admin/stores
 * List stores for user's account
 */
export async function GET(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Store listing cannot be accessed via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const stores = await storeService.listStoresForUser(tenant.userId);

        return NextResponse.json({ stores });
    } catch (error: any) {
        console.error('List stores error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list stores' },
            { status: 500 }
        );
    }
}
