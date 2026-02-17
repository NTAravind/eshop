import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenant, authorizeStore } from '@/lib/auth-helpers';
import * as storefrontService from '@/services/storefront.service';
import { StorefrontDocStatus } from '@/app/generated/prisma';

// Schema for theme variables
const themeVarsSchema = z.record(z.string(), z.string());

/**
 * GET /api/admin/stores/[storeId]/storefront/theme
 * Get the theme for a store
 */
export async function GET(
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

        // Check query for status
        const status = request.nextUrl.searchParams.get('status') as StorefrontDocStatus | null;

        // Get theme(s)
        const draft = await storefrontService.getTheme(storeId, StorefrontDocStatus.DRAFT);
        const published = await storefrontService.getTheme(storeId, StorefrontDocStatus.PUBLISHED);

        if (status === 'DRAFT') {
            return NextResponse.json({ theme: draft });
        }
        if (status === 'PUBLISHED') {
            return NextResponse.json({ theme: published });
        }

        return NextResponse.json({ draft, published });
    } catch (error) {
        console.error('Error getting storefront theme:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/stores/[storeId]/storefront/theme
 * Update the draft theme
 */
export async function PATCH(
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

        // Parse body
        const body = await request.json();
        const vars = themeVarsSchema.parse(body.vars ?? body);

        // Save draft theme
        const theme = await storefrontService.saveThemeDraft(storeId, vars);

        return NextResponse.json({ theme });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Error updating storefront theme:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
