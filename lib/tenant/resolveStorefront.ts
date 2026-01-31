import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface StorefrontContext {
    storeId: string;
    userId?: string;
    sessionId?: string;
    isGuest: boolean;
}

export async function resolveStorefront(storeIdParam?: string): Promise<StorefrontContext> {
    const headersList = await headers();
    const storeId = storeIdParam || headersList.get('x-store-id');

    if (!storeId) {
        throw new Error('Store ID is required (X-Store-Id header)');
    }

    // Get User Session if available
    const session = await auth();
    const userId = session?.user?.id;

    // Get Session ID from header (for guest carts)
    const sessionId = headersList.get('x-session-id') || undefined;

    return {
        storeId,
        userId,
        sessionId,
        isGuest: !userId
    };
}
