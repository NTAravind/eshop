import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as userDal from '@/dal/user.dal';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/billing-addresses
 * List all billing addresses for current user
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

        const addresses = await userDal.listBillingAddresses(session.user.id);

        return NextResponse.json({ addresses });
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}

/**
 * POST /api/customer/billing-addresses
 * Create a new billing address
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await req.json();

        const address = await userDal.createBillingAddress(
            session.user.id,
            {
                address1: body.address1,
                address2: body.address2,
                city: body.city,
                state: body.state,
                postalCode: body.postalCode,
                country: body.country,
            }
        );

        return NextResponse.json(address, { status: 201 });
    } catch (error: any) {
        const errorResponse = toErrorResponse(error);
        return NextResponse.json(
            { error: errorResponse.error },
            { status: errorResponse.statusCode }
        );
    }
}
