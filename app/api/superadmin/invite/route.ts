import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRbacContext } from '@/lib/rbac';
import { inviteAccountUser } from '@/services/invitation.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const context = await getRbacContext({});
        if (!context?.isSuperAdmin) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await req.json();
        const { accountId, email, role = 'OWNER' } = body;

        if (!accountId || !email) {
            return NextResponse.json({ error: 'Missing accountId or email' }, { status: 400 });
        }

        const invitation = await inviteAccountUser(session.user.id, accountId, email, role);

        return NextResponse.json({ success: true, invitation });
    } catch (error: any) {
        console.error('Invite error:', error);
        return NextResponse.json({ error: error.message || 'Failed to invite user' }, { status: 500 });
    }
}
