import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenant, authorizeStore } from '@/lib/auth-helpers';
import * as storefrontService from '@/services/storefront.service';

// Schema for updating a document
const updateDocumentSchema = z.object({
    tree: z.record(z.string(), z.unknown()).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/admin/stores/[storeId]/storefront/documents/[docId]
 * Get a specific document by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string; docId: string }> }
) {
    try {
        const { storeId, docId } = await params;

        // Authorize
        const tenant = await resolveTenant();
        if (!tenant) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authorized = await authorizeStore(tenant.user.id, storeId, ['OWNER', 'MANAGER']);
        if (!authorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get document
        const document = await storefrontService.getDocumentById(docId);
        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Verify store ownership
        if (document.storeId !== storeId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ document });
    } catch (error) {
        console.error('Error getting storefront document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/stores/[storeId]/storefront/documents/[docId]
 * Update a document
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string; docId: string }> }
) {
    try {
        const { storeId, docId } = await params;

        // Authorize
        const tenant = await resolveTenant();
        if (!tenant) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authorized = await authorizeStore(tenant.user.id, storeId, ['OWNER', 'MANAGER']);
        if (!authorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get existing document
        const existing = await storefrontService.getDocumentById(docId);
        if (!existing) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Verify store ownership
        if (existing.storeId !== storeId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse body
        const body = await request.json();
        const data = updateDocumentSchema.parse(body);

        // Update via saveDraft (which handles the update)
        const treeData = (data.tree ?? existing.tree) as unknown as import('@/types/storefront-builder').StorefrontNode;
        const document = await storefrontService.saveDraft(
            storeId,
            existing.kind,
            existing.key,
            treeData,
            data.meta ?? existing.meta
        );

        return NextResponse.json({ document });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes('Invalid document')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error updating storefront document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/stores/[storeId]/storefront/documents/[docId]
 * Delete a document
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string; docId: string }> }
) {
    try {
        const { storeId, docId } = await params;

        // Authorize
        const tenant = await resolveTenant();
        if (!tenant) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authorized = await authorizeStore(tenant.user.id, storeId, ['OWNER']);
        if (!authorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get existing document
        const existing = await storefrontService.getDocumentById(docId);
        if (!existing) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Verify store ownership
        if (existing.storeId !== storeId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete
        await storefrontService.deleteDocument(docId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting storefront document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
