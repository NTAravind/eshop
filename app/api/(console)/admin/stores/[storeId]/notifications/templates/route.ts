import { NextResponse } from 'next/server';
import prisma from '@/server/db/prisma';
import { getSessionUser } from '@/server/auth/getSession';
import { requireStoreRole } from '@/server/auth/requireStore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await requireStoreRole(user.id, storeId, 'SUPPORT');

        const templates = await prisma.notificationTemplate.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ templates });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await requireStoreRole(user.id, storeId, 'MANAGER');

        const body = await request.json();
        const {
            channel,
            eventType,
            whatsappTemplateName,
            whatsappLanguageCode,
            subject,
            content,
            isActive
        } = body;

        // Basic validation
        if (!channel || !eventType) {
            return NextResponse.json({ error: 'Channel and Event Type are required' }, { status: 400 });
        }

        const template = await prisma.notificationTemplate.create({
            data: {
                storeId,
                channel,
                eventType,
                whatsappTemplateName,
                whatsappLanguageCode,
                subject,
                content,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json({ template });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
