import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { resolveTenant } from '@/lib/tenant/resolveTenant';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { host, port, user, pass, from, secure } = body;

        // Validate required fields
        if (!host || !port || !user || !pass || !from) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Identify the account
        // Since this is a tenant admin action, we need to find the account they own.
        // We can look up the account where they are an OWNER.
        const accountUser = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: 'OWNER',
            },
        });

        if (!accountUser) {
            return NextResponse.json({ error: 'No account found where you are an owner' }, { status: 403 });
        }

        const emailSettings = {
            host,
            port,
            user,
            pass,
            from,
            secure,
        };

        await prisma.billingAccount.update({
            where: { id: accountUser.accountId },
            data: {
                emailSettings,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving email settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
