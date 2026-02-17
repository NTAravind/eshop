import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as storeStaffService from '@/services/storestaff.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/store-staff
 * Add a staff member to the store (OWNER only)
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

    const staff = await storeStaffService.addStaffMember(
      tenant.userId,
      tenant.storeId,
      {
        email: body.email,
        role: body.role,
      }
    );

    return NextResponse.json(staff, { status: 201 });
  } catch (error: any) {
    console.error('Add staff error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add staff member' },
      { status: error.message?.includes('Only') || error.message?.includes('already') ? 403 : 400 }
    );
  }
}

/**
 * GET /api/store-staff
 * List all staff members (requires SUPPORT role)
 */
export async function GET(req: NextRequest) {
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

    const staff = await storeStaffService.listStaff(
      tenant.userId,
      tenant.storeId
    );

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error('List staff error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list staff' },
      { status: error.message?.includes('denied') ? 403 : 400 }
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
 *   "id": "staff_abc123",
 *   "storeId": "store_123",
 *   "userId": "user_xyz789",
 *   "role": "MANAGER",
 *   "createdAt": "2026-01-06T10:30:00.000Z",
 *   "user": {
 *     "id": "user_xyz789",
 *     "email": "john@example.com",
 *     "name": "John Doe",
 *     "image": null
 *   }
 * }
 * 
 * Example Response (GET):
 * {
 *   "staff": [
 *     {
 *       "id": "staff_abc123",
 *       "role": "OWNER",
 *       "user": {
 *         "id": "user_123",
 *         "email": "owner@example.com",
 *         "name": "Store Owner"
 *       }
 *     },
 *     {
 *       "id": "staff_def456",
 *       "role": "MANAGER",
 *       "user": {
 *         "id": "user_456",
 *         "email": "manager@example.com",
 *         "name": "John Manager"
 *       }
 *     }
 *   ]
 * }
 */