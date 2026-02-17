import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as userDal from '@/dal/user.dal';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/customer/billing-addresses/[id]
 * Update a billing address
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await req.json();

        const address = await userDal.updateBillingAddress(
            session.user.id,
            id,
            {
                address1: body.address1,
                address2: body.address2,
                city: body.city,
                state: body.state,
                postalCode: body.postalCode,
                country: body.country,
            }
        );

        return NextResponse.json(address);
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}

/**
 * DELETE /api/customer/billing-addresses/[id]
 * Delete a billing address
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await userDal.deleteBillingAddress(session.user.id, id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
