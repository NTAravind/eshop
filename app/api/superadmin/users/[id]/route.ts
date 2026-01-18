import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/superadmin/users/[id]
 * Get user details
 * Requires superadmin role
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                ownedAccounts: {
                    include: {
                        account: {
                            include: {
                                subscription: {
                                    include: {
                                        plan: true,
                                    },
                                },
                                stores: true,
                            },
                        },
                    },
                },
                stores: {
                    include: {
                        store: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get user' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/superadmin/users/[id]
 * Update user
 * Requires superadmin role
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        const body = await req.json();

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email,
                // Add other updatable fields as needed
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/superadmin/users/[id]
 * Delete user
 * Requires superadmin role
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // TODO: Add superadmin role check

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}
