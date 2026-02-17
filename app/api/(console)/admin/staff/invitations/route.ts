import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/server/tenant/resolveTenant';
import * as storeStaffService from '@/services/storestaff.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/staff/invitations
 * Invite a staff member to the store (OWNER only)
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        // Staff management requires session (not API keys)
        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Staff management cannot be done via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const body = await req.json();

        if (!body.email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        if (!body.role) {
            return NextResponse.json(
                { error: 'Role is required' },
                { status: 400 }
            );
        }

        const invitation = await import('@/services/invitation.service').then(m =>
            m.inviteStoreStaff(
                tenant.userId!,
                tenant.storeId,
                body.email,
                body.role
            )
        );

        return NextResponse.json(invitation, { status: 201 });
    } catch (error) {
        console.error('Invite staff error:', error);
        const message = error instanceof Error ? error.message : 'Failed to invite staff member';
        return NextResponse.json(
            { error: message },
            { status: message?.includes('configure') ? 400 : 500 }
        );
    }
}

/**
 * GET /api/admin/staff/invitations
 * List all pending invitations (requires MANAGER role)
 */
export async function GET() {
    try {
        const tenant = await resolveTenant();

        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Staff management cannot be accessed via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const invitations = await storeStaffService.listInvitations(
            tenant.userId,
            tenant.storeId
        );

        return NextResponse.json({ invitations });
    } catch (error) {
        console.error('List invitations error:', error);
        const message = error instanceof Error ? error.message : 'Failed to list invitations';
        return NextResponse.json(
            { error: message },
            { status: message?.includes('denied') ? 403 : 400 }
        );
    }
}

/**
 * DELETE /api/admin/staff/invitations
 * Remove a pending invitation (OWNER only)
 * Body: { email: string }
 */
export async function DELETE(req: NextRequest) {
    try {
        const tenant = await resolveTenant();

        if (tenant.apiKeyId) {
            return NextResponse.json(
                { error: 'Staff management cannot be done via API keys' },
                { status: 403 }
            );
        }

        if (!tenant.userId) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 403 }
            );
        }

        const body = await req.json();

        if (!body.email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await storeStaffService.removeInvitation(
            tenant.userId,
            tenant.storeId,
            body.email
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove invitation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to remove invitation';
        return NextResponse.json(
            { error: message },
            { status: message?.includes('Only') ? 403 : 400 }
        );
    }
}

/**
 * Example Request (POST):
 * {
 *   "email": "john@example.com",
 *   "role": "MANAGER"
 * }
 * 
 * Example Response (POST):
 * {
 *   "id": "invite_abc123",
 *   "storeId": "store_123",
 *   "email": "john@example.com",
 *   "role": "MANAGER",
 *   "createdAt": "2026-01-26T10:30:00.000Z"
 * }
 * 
 * Example Response (GET):
 * {
 *   "invitations": [
 *     {
 *       "id": "invite_abc123",
 *       "email": "john@example.com",
 *       "role": "MANAGER",
 *       "createdAt": "2026-01-26T10:30:00.000Z"
 *     }
 *   ]
 * }
 * 
 * Example Request (DELETE):
 * {
 *   "email": "john@example.com"
 * }
 * 
 * Example Response (DELETE):
 * {
 *   "success": true
 * }
 */
