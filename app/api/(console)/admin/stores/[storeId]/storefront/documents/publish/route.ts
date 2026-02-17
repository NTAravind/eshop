import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenant, authorizeStore } from '@/lib/auth-helpers';
import * as storefrontService from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';

// Schema for publishing
const publishSchema = z.object({
    kind: z.nativeEnum(StorefrontDocKind),
    key: z.string().min(1).max(100),
});

/**
 * POST /api/admin/stores/[storeId]/storefront/documents/publish
 * Publish a document (copy draft to published)
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

        // Parse body
        const body = await request.json();
        const data = publishSchema.parse(body);

        // Publish
        const document = await storefrontService.publishDocument(
            storeId,
            data.kind,
            data.key
        );

        return NextResponse.json({ document });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes('No draft')) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        console.error('Error publishing storefront document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
