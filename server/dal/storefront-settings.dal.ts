import prisma from '@/server/db/prisma';
import type { Prisma } from '@/app/generated/prisma';

/**
 * Get storefront settings for a store
 */
export async function getStorefrontSettings(storeId: string) {
    return prisma.storefrontSettings.findUnique({
        where: { storeId },
    });
}

/**
 * Upsert storefront settings
 */
export async function upsertStorefrontSettings(
    storeId: string,
    data: Prisma.StorefrontSettingsUpdateInput
) {
    return prisma.storefrontSettings.upsert({
        where: { storeId },
        update: data,
        create: {
            store: {
                connect: { id: storeId },
            },
            ...data,
        } as Prisma.StorefrontSettingsCreateInput,
    });
}
