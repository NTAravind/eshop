import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';
import { productCardPrefab, navbarPrefab, cartSidebarPrefab, orderCardPrefab } from '@/lib/storefront/defaults/prefabs';

export async function POST() {
    try {
        console.log('Starting prefab migration...');

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
                prefabs: [] as string[],
            };

            for (const prefab of prefabs) {
                // Check if prefab already exists
                const existing = await prisma.storefrontDocument.findFirst({
                    where: {
                        storeId: store.id,
                        kind: StorefrontDocKind.PREFAB,
                        key: prefab.key,
                    },
                });

                if (existing) {
                    console.log(`  - Prefab ${prefab.key} already exists, skipping`);
                    continue;
                }

                // Create draft and published versions
                await prisma.storefrontDocument.create({
                    data: {
                        storeId: store.id,
                        kind: StorefrontDocKind.PREFAB,
                        key: prefab.key,
                        status: StorefrontDocStatus.DRAFT,
                        tree: prefab.tree as object,
                    },
                });

                await prisma.storefrontDocument.create({
                    data: {
                        storeId: store.id,
                        kind: StorefrontDocKind.PREFAB,
                        key: prefab.key,
                        status: StorefrontDocStatus.PUBLISHED,
                        tree: prefab.tree as object,
                    },
                });

                console.log(`  ✓ Created prefab: ${prefab.key}`);
                storeResults.prefabs.push(prefab.key);
            }

            results.push(storeResults);
        }

        return NextResponse.json({
            success: true,
            message: 'Migration complete!',
            results,
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
