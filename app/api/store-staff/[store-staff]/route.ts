import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as storeStaffService from '@/services/storestaff.service';

/**
 * PATCH /api/store-staff/[userId]
 * Update staff member's role (OWNER only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    if (!body.role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    const staff = await storeStaffService.updateStaffRole(
      tenant.userId,
      tenant.storeId,
      params.userId,
      body.role
    );

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error('Update staff role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update staff role' },
      { status: error.message?.includes('Only') || error.message?.includes('Cannot') ? 403 : 400 }
    );
  }
}

/**
 * DELETE /api/store-staff/[userId]
 * Remove staff member from store (OWNER only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    await storeStaffService.removeStaffMember(
      tenant.userId,
      tenant.storeId,
      params.userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove staff error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove staff member' },
      { status: error.message?.includes('Only') || error.message?.includes('Cannot') ? 403 : 400 }
    );
  }
}

/**
 * Example Request (PATCH):
 * {
 *   "role": "SUPPORT"
 * }
 * 
 * Example Response (PATCH):
 * {
 *   "id": "staff_abc123",
 *   "storeId": "store_123",
 *   "userId": "user_xyz789",
 *   "role": "SUPPORT",
 *   "createdAt": "2026-01-06T10:30:00.000Z",
 *   "user": {
 *     "id": "user_xyz789",
 *     "email": "john@example.com",
 *     "name": "John Doe"
 *   }
 * }
 * 
 * Example Response (DELETE):
 * {
 *   "success": true
 * }
 */