import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenant, authorizeStore } from '@/lib/auth-helpers';
import * as storefrontService from '@/services/storefront.service';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';

// Schema for listing documents
const listQuerySchema = z.object({
    kind: z.nativeEnum(StorefrontDocKind).optional(),
    status: z.nativeEnum(StorefrontDocStatus).optional(),
});

// Schema for creating a document
const createDocumentSchema = z.object({
    kind: z.nativeEnum(StorefrontDocKind),
    key: z.string().min(1).max(100),
    tree: z.record(z.string(), z.unknown()),
    meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/admin/stores/[storeId]/storefront/documents
 * List all documents for a store
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

        // Parse query params
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const query = listQuerySchema.parse(searchParams);

        // Get documents
        const documents = await storefrontService.listDocuments(
            storeId,
            query.kind,
            query.status
        );

        return NextResponse.json({ documents });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Error listing storefront documents:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/stores/[storeId]/storefront/documents
 * Create or update a document draft
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
        const data = createDocumentSchema.parse(body);

        // Save draft
        const treeData = data.tree as unknown as import('@/types/storefront-builder').StorefrontNode;
        const document = await storefrontService.saveDraft(
            storeId,
            data.kind,
            data.key,
            treeData,
            data.meta
        );

        return NextResponse.json({ document }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes('Invalid document')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error creating storefront document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
