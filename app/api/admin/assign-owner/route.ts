import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    console.log('[API /api/admin/assign-owner] Starting request');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log('[API /api/admin/assign-owner] Unauthorized - no session');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[API /api/admin/assign-owner] User authenticated:', session.user.id);

        const body = await request.json();
        const { storeId, email } = body;

        if (!storeId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: storeId and email' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            console.log('[API /api/admin/assign-owner] Invalid email format:', normalizedEmail);
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        console.log('[API /api/admin/assign-owner] Fetching store:', storeId);

        // Check if the current user has access to this store
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: {
                account: {
                    include: {
                        users: {
                            where: { userId: session.user.id }
                        }
                    }
                },
                staff: {
                    where: { userId: session.user.id }
                }
            }
        });

        if (!store) {
            console.log('[API /api/admin/assign-owner] Store not found:', storeId);
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        console.log('[API /api/admin/assign-owner] Store found:', store.name);

        // Check if user has permission (either account member or store owner)
        const isAccountMember = store.account.users.length > 0;
        const isStoreOwner = store.staff.some(s => s.role === 'OWNER');

        console.log('[API /api/admin/assign-owner] Permission check:', { isAccountMember, isStoreOwner });

        if (!isAccountMember && !isStoreOwner) {
            console.log('[API /api/admin/assign-owner] Permission denied');
            return NextResponse.json(
                { error: 'You do not have permission to assign owners to this store' },
                { status: 403 }
            );
        }

        console.log('[API /api/admin/assign-owner] Finding user by email:', normalizedEmail);

        // Find or create the user
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            console.log('[API /api/admin/assign-owner] User not found, creating new user');
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: normalizedEmail.split('@')[0],
                },
            });
            console.log('[API /api/admin/assign-owner] Created new user:', user.id);
        } else {
            console.log('[API /api/admin/assign-owner] Found existing user:', user.id);
        }

        // Check if user is already assigned to this store
        const existingStaff = await prisma.storeStaff.findUnique({
            where: {
                storeId_userId: {
                    storeId: storeId,
                    userId: user.id,
                },
            },
        });

        // ENFORCE SINGLE OWNER POLICY
        // Remove ALL existing owners for this store before creating/updating the new one.
        // This ensures "only making the store owner assigned by the tenant admin as the store admin".
        console.log('[API /api/admin/assign-owner] Removing existing owners to enforce single-owner policy');
        await prisma.storeStaff.deleteMany({
            where: {
                storeId: storeId,
                role: 'OWNER'
            }
        });

        // Create new staff assignment as OWNER
        // Note: We always create fresh because we just deleted potentially existing staff entry if it was an owner.
        // If the target user was a MANAGER, we should update instead. 

        // Re-check existence as we might have deleted it if they were OWNER (redundant but safe)
        // Actually, if we want to preserve the target user's ID to upsert properly:
        // Better logic:
        // 1. Delete all owners EXCEPT the target user (if they are already owner? No, we just replace everyone else).
        // 2. Upsert the target user.

        // Let's stick to: Remove ALL owners. Upsert target user as OWNER.

        // However, if the target user was a 'MANAGER', deleteMany(role: OWNER) won't touch them.
        // If the target user was 'OWNER', they are deleted. So we just need to upsert.

        console.log('[API /api/admin/assign-owner] Assigning new owner:', normalizedEmail);

        await prisma.storeStaff.upsert({
            where: {
                storeId_userId: {
                    storeId: storeId,
                    userId: user.id,
                }
            },
            update: { role: 'OWNER' },
            create: {
                storeId: storeId,
                userId: user.id,
                role: 'OWNER'
            }
        });

        console.log('[API /api/admin/assign-owner] Successfully assigned new owner');
        revalidatePath(`/admin/stores/${storeId}/staff`);
        revalidatePath('/admin/stores');

        return NextResponse.json({
            success: true,
            message: `Successfully assigned ${normalizedEmail} as the new store owner`
        });

    } catch (error: any) {
        console.error('[API /api/admin/assign-owner] Error occurred:', error);
        console.error('[API /api/admin/assign-owner] Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to assign store owner' },
            { status: 500 }
        );
    }
}
