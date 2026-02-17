import { NextRequest, NextResponse } from 'next/server';
import { validateToken, acceptInvitation } from '@/services/invitation.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/invitations/accept
 * Accept an invitation (Account or Store)
 * Body: { token: string, type: 'store' | 'account' }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, type, userId } = body;

        if (!token || !type || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (type !== 'store' && type !== 'account') {
            return NextResponse.json(
                { error: 'Invalid invitation type' },
                { status: 400 }
            );
        }

        // Validate token first (optional, but good for error messages)
        const invite = await validateToken(type, token);
        if (!invite) {
            return NextResponse.json(
                { error: 'Invalid or expired invitation' },
                { status: 404 }
            );
        }

        // Accept
        const result = await acceptInvitation(userId, type, token);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Accept invitation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to accept invitation' },
            { status: 400 }
        );
    }
}

/**
 * GET /api/invitations/validate
 * Check if a token is valid
 * Query: ?token=xyz&type=store
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        const type = searchParams.get('type') as 'store' | 'account';

        if (!token || !type) {
            return NextResponse.json(
                { error: 'Missing token or type' },
                { status: 400 }
            );
        }

        const invite = await validateToken(type, token);

        if (!invite) {
            return NextResponse.json({ valid: false }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            email: invite.email,
            role: invite.role,
            name: invite.name // Store or Account name
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }
}
