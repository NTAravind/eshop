import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/services/notification/notification.service';
import { NotificationChannel } from '@/app/generated/prisma';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/getSession';
import { requireStoreRole } from '@/lib/auth/requireStore';

export const dynamic = 'force-dynamic';

const sendSchema = z.object({
    channel: z.nativeEnum(NotificationChannel),
    to: z.string(), // Phone number, email, or token string/JSON
    content: z.string().min(1),
    metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify permission
        await requireStoreRole(user.id, storeId, 'MANAGER');

        const body = await req.json();

        // Validate Input
        const parseResult = sendSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const { channel, to, content, metadata } = parseResult.data;

        // Send Notification
        const result = await sendNotification(
            storeId,
            channel,
            to,
            content,
            metadata
        );

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to send notification', details: result.error, logId: result.id },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            logId: result.id,
            providerId: result.providerId,
        });
    } catch (error: any) {
        console.error('[Notification API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
