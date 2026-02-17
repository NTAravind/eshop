import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import * as storeService from '@/services/store.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/stores
 * Create a new store
 */
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        const data = await request.json();

        const store = await storeService.createStore(session.user.id, {
            name: data.name,
            slug: data.slug,
        });

        return NextResponse.json(store, { status: 201 });
    } catch (error) {
        console.error('Create store error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create store';
        return NextResponse.json(
            { error: message },
            { status: message?.includes('limit') || message?.includes('already') ? 400 : 500 }
        );
    }
}

/**
 * GET /api/admin/stores
 * List stores for user's account
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        const stores = await storeService.listStoresForUser(session.user.id);

        return NextResponse.json({ stores });
    } catch (error) {
        console.error('List stores error:', error);
        const message = error instanceof Error ? error.message : 'Failed to list stores';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
