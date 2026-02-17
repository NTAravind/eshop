import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/getSession';
import { requireStoreRole } from '@/lib/auth/requireStore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ storeId: string; templateId: string }> }
) {
    try {
        const { storeId, templateId } = await params;
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await requireStoreRole(user.id, storeId, 'SUPPORT');

        const template = await prisma.notificationTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template || template.storeId !== storeId) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ template });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ storeId: string; templateId: string }> }
) {
    try {
        const { storeId, templateId } = await params;
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await requireStoreRole(user.id, storeId, 'MANAGER');

        const body = await request.json();

        // verify ownership
        const existing = await prisma.notificationTemplate.findUnique({
            where: { id: templateId },
        });

        if (!existing || existing.storeId !== storeId) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const template = await prisma.notificationTemplate.update({
            where: { id: templateId },
            data: {
                ...body,
                storeId, // ensure storeId doesn't change
            },
        });

        return NextResponse.json({ template });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ storeId: string; templateId: string }> }
) {
    try {
        const { storeId, templateId } = await params;
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await requireStoreRole(user.id, storeId, 'MANAGER');

        // verify ownership
        const existing = await prisma.notificationTemplate.findUnique({
            where: { id: templateId },
        });

        if (!existing || existing.storeId !== storeId) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        await prisma.notificationTemplate.delete({
            where: { id: templateId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
