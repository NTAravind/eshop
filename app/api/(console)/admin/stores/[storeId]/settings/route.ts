import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import prisma from '@/lib/prisma';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stores/[storeId]/settings
 * Get store settings
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const tenant = await resolveTenant(storeId);

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                name: true,
                slug: true,
                requirePhoneNumber: true,
            }
        });

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(store);
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}

/**
 * PATCH /api/admin/stores/[storeId]/settings
 * Update store settings
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const tenant = await resolveTenant(storeId);

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const body = await req.json();

        const store = await prisma.store.update({
            where: { id: storeId },
            data: {
                ...(body.requirePhoneNumber !== undefined && {
                    requirePhoneNumber: body.requirePhoneNumber
                }),
            },
            select: {
                id: true,
                name: true,
                slug: true,
                requirePhoneNumber: true,
            }
        });

        return NextResponse.json(store);
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
