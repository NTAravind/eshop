import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, authorizeStore } from '@/lib/auth-helpers';
import * as storefrontService from '@/services/storefront.service';

/**
 * POST /api/admin/stores/[storeId]/storefront/theme/publish
 * Publish the theme (copy draft to published)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;

        // Authorize
        const tenant = await resolveTenant();
        if (!tenant) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authorized = await authorizeStore(tenant.user.id, storeId, ['OWNER', 'MANAGER']);
        if (!authorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Publish theme
        const theme = await storefrontService.publishTheme(storeId);

        return NextResponse.json({ theme });
    } catch (error) {
        if (error instanceof Error && error.message.includes('No draft')) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        console.error('Error publishing storefront theme:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
