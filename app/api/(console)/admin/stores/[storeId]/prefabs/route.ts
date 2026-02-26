import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import prisma from '@/server/db/prisma';
import * as storeService from '@/services/store.service';
import { StorefrontDocKind } from '@/app/generated/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const session = await auth();
        const { storeId } = await params;

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const hasAccess = await storeService.verifyStoreAccess(session.user.id, storeId);
        if (!hasAccess) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const url = new URL(req.url);
        const prefabType = url.searchParams.get('type');

        const allPrefabs = await prisma.storefrontDocument.findMany({
            where: {
                storeId,
                kind: StorefrontDocKind.PREFAB,
                status: 'PUBLISHED'
            },
            select: {
                id: true,
                key: true,
                meta: true,
            },
            orderBy: {
                key: 'asc'
            }
        });

        let filtered = allPrefabs;
        if (prefabType) {
            filtered = allPrefabs.filter(p => {
                if (!p.meta || typeof p.meta !== 'object') return false;
                return (p.meta as any).prefabType === prefabType;
            });
        }

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('[PREFABS_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
