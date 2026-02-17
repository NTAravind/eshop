import { NextResponse } from 'next/server';
import prisma from '@/server/db/prisma';
import {
    defaultCheckoutPage,
    defaultCollectionPage,
    defaultGlobalLayout,
    defaultHomePage,
    defaultLoginPage,
    defaultOrdersPage,
    defaultPdpTemplate,
    defaultProfilePage,
} from '@/modules/storefront/defaults';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';

const cartPlaceholder = { id: 'cart-root', type: 'Container', props: {}, styles: {}, children: [] } as const;

const defaultDocs = [
    { kind: StorefrontDocKind.LAYOUT, key: 'GLOBAL_LAYOUT', tree: defaultGlobalLayout },
    { kind: StorefrontDocKind.PAGE, key: 'HOME', tree: defaultHomePage },
    { kind: StorefrontDocKind.PAGE, key: 'COLLECTION', tree: defaultCollectionPage },
    { kind: StorefrontDocKind.PAGE, key: 'CART', tree: cartPlaceholder },
    { kind: StorefrontDocKind.PAGE, key: 'CHECKOUT', tree: defaultCheckoutPage },
    { kind: StorefrontDocKind.PAGE, key: 'ORDERS', tree: defaultOrdersPage },
    { kind: StorefrontDocKind.PAGE, key: 'PROFILE', tree: defaultProfilePage },
    { kind: StorefrontDocKind.PAGE, key: 'LOGIN', tree: defaultLoginPage },
    { kind: StorefrontDocKind.TEMPLATE, key: 'PDP:default', tree: defaultPdpTemplate },
];

async function upsertDocument(storeId: string, kind: StorefrontDocKind, key: string, tree: unknown) {
    const statuses = [StorefrontDocStatus.DRAFT, StorefrontDocStatus.PUBLISHED];
    const results: { status: StorefrontDocStatus; action: 'updated' | 'created' }[] = [];

    for (const status of statuses) {
        const existing = await prisma.storefrontDocument.findFirst({
            where: { storeId, kind, key, status },
        });

        if (existing) {
            await prisma.storefrontDocument.update({
                where: { id: existing.id },
                data: { tree: tree as object },
            });
            results.push({ status, action: 'updated' });
        } else {
            await prisma.storefrontDocument.create({
                data: {
                    storeId,
                    kind,
                    key,
                    status,
                    tree: tree as object,
                },
            });
            results.push({ status, action: 'created' });
        }
    }

    return results;
}

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const targetStoreId = searchParams.get('storeId');

        const stores = targetStoreId
            ? await prisma.store.findMany({ where: { id: targetStoreId } })
            : await prisma.store.findMany();

        if (targetStoreId && stores.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Store not found' },
                { status: 404 }
            );
        }

        const results = [] as Array<{
            storeId: string;
            storeName: string | null;
            documents: Array<{
                key: string;
                kind: StorefrontDocKind;
                statuses: { status: StorefrontDocStatus; action: 'updated' | 'created' }[];
            }>;
        }>;

        for (const store of stores) {
            const storeResult = {
                storeId: store.id,
                storeName: store.name,
                documents: [] as Array<{
                    key: string;
                    kind: StorefrontDocKind;
                    statuses: { status: StorefrontDocStatus; action: 'updated' | 'created' }[];
                }>,
            };

            for (const doc of defaultDocs) {
                const statuses = await upsertDocument(store.id, doc.kind, doc.key, doc.tree);
                storeResult.documents.push({ key: doc.key, kind: doc.kind, statuses });
            }

            results.push(storeResult);
        }

        return NextResponse.json({ success: true, message: 'Default pages updated', results });
    } catch (error) {
        console.error('Update default pages failed:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
