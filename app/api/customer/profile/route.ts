import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as userDal from '@/dal/user.dal';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/profile
 * Get current user's profile
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const profile = await userDal.getUserProfile(session.user.id);

        if (!profile) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}

/**
 * PATCH /api/customer/profile
 * Update current user's profile (name, phone)
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await req.json();

        const updatedProfile = await userDal.updateUserProfile(
            session.user.id,
            {
                name: body.name,
                phone: body.phone,
            }
        );

        return NextResponse.json(updatedProfile);
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
