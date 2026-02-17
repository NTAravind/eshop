'use server';

import { saveSettings } from '@/services/storefront.service';
import { revalidatePath } from 'next/cache';
import { resolveTenant } from '@/server/tenant/resolveTenant';
import prisma from '@/server/db/prisma';

export async function updateStorefrontSettings(storeId: string, settings: any) {
    // Ensure access
    await resolveTenant(storeId);

    try {
        await saveSettings(storeId, settings);

        // Revalidate admin page
        revalidatePath(`/admin/stores/${storeId}/settings/storefront`);

        // Revalidate storefront paths using slug
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { slug: true }
        });

        if (store?.slug) {
            revalidatePath(`/store/${store.slug}`);
            revalidatePath(`/store/${store.slug}/checkout`);
            revalidatePath(`/store/${store.slug}`, 'layout');
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to save storefront settings:', error);
        return { success: false, error: 'Failed to save settings' };
    }
}
