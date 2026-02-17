import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as storeService from '@/services/store.service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stores/[storeId]
 * Get store details
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const tenant = await resolveTenant();

        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Store access cannot be done via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const store = await storeService.getStoreWithAccount(storeId);

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        // Verify user has access to this store
        const hasAccess = await prisma.storeStaff.findUnique({
            where: {
                storeId_userId: {
                    storeId: storeId,
                    userId: tenant.userId,
                },
            },
        });

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json(store);
    } catch (error: any) {
        console.error('Get store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get store' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/stores/[storeId]
 * Update store settings
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const tenant = await resolveTenant();

        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Store updates cannot be done via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        // Verify user is OWNER or MANAGER
        const storeStaff = await prisma.storeStaff.findUnique({
            where: {
                storeId_userId: {
                    storeId: storeId,
                    userId: tenant.userId,
                },
            },
        });

        if (!storeStaff || !['OWNER', 'MANAGER'].includes(storeStaff.role)) {
            return NextResponse.json(
                { error: 'Only store owners and managers can update stores' },
                { status: 403 }
            );
        }

        const body = await req.json();

        const store = await prisma.store.update({
            where: { id: storeId },
            data: {
                name: body.name,
                // Add other updatable fields as needed
            },
        });

        return NextResponse.json(store);
    } catch (error: any) {
        console.error('Update store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update store' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/stores/[storeId]
 * Delete store (OWNER only)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const tenant = await resolveTenant();

        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Store deletion cannot be done via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        await storeService.deleteStore(tenant.userId, storeId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete store error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete store' },
            { status: error.message?.includes('Only') ? 403 : 500 }
        );
    }
}
