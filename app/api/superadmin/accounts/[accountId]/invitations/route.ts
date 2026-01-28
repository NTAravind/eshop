import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { inviteAccountUser } from '@/services/invitation.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/superadmin/accounts/[accountId]/invitations
 * Invite a Tenant Admin (Account Owner/Member)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ accountId: string }> } // Params are Promises in Next.js 15
) {
    try {
        const { accountId } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, role } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const invitation = await inviteAccountUser(
            session.user.id,
            accountId,
            email,
            role || 'MEMBER'
        );

        return NextResponse.json(invitation, { status: 201 });
    } catch (error: any) {
        console.error('Invite account user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to invite user' },
            { status: 400 }
        );
    }
}
