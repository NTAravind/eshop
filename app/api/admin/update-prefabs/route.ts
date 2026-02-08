import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';
import { productCardPrefab, navbarPrefab, cartSidebarPrefab, orderCardPrefab } from '@/lib/storefront/defaults/prefabs';

export async function POST() {
    try {
        console.log('Starting prefab update...');

        // Get all stores
        const stores = await prisma.store.findMany();
        console.log(`Found ${stores.length} stores`);

        const prefabs = [
            { key: 'ProductCard', tree: productCardPrefab },
            { key: 'Navbar', tree: navbarPrefab },
            { key: 'CartSidebar', tree: cartSidebarPrefab },
            { key: 'OrderCard', tree: orderCardPrefab },
        ];

        const results = [];

        for (const store of stores) {
            console.log(`Processing store: ${store.name} (${store.id})`);
            const storeResults = {
                storeId: store.id,
                storeName: store.name,
                updated: [] as string[],
            };

            for (const prefab of prefabs) {
                // Update draft version
                await prisma.storefrontDocument.updateMany({
                    where: {
                        storeId: store.id,
                        kind: StorefrontDocKind.PREFAB,
                        key: prefab.key,
                        status: StorefrontDocStatus.DRAFT,
                    },
                    data: {
                        tree: prefab.tree as object,
                    },
                });

                // Update published version
                await prisma.storefrontDocument.updateMany({
                    where: {
                        storeId: store.id,
                        kind: StorefrontDocKind.PREFAB,
                        key: prefab.key,
                        status: StorefrontDocStatus.PUBLISHED,
                    },
                    data: {
                        tree: prefab.tree as object,
                    },
                });

                console.log(`  ✓ Updated prefab: ${prefab.key}`);
                storeResults.updated.push(prefab.key);
            }

            results.push(storeResults);
        }

        return NextResponse.json({
            success: true,
            message: 'Update complete!',
            results,
        });
    } catch (error) {
        console.error('Update failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
