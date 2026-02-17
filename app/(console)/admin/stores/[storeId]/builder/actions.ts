'use server';

import {
    getStoreBySlug,
    getStoreWithAccount
} from '@/services/store.service';
import * as storefrontService from '@/services/storefront.service';
import type { StorefrontNode, ThemeVars } from '@/types/storefront-builder';
import { StorefrontDocKind } from '@/app/generated/prisma';
import { revalidatePath } from 'next/cache';

export async function saveDocument(
    storeId: string,
    documentId: string,
    tree: StorefrontNode
) {
    try {
        const doc = await storefrontService.getDocumentById(documentId);
        if (!doc) {
            throw new Error('Document not found');
        }

        if (doc.storeId !== storeId) {
            throw new Error('Unauthorized');
        }

        await storefrontService.saveDraft(
            storeId,
            doc.kind as StorefrontDocKind,
            doc.key,
            tree
        );

        revalidatePath(`/admin/stores/${storeId}/builder/${documentId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to save document:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function publishDocument(
    storeId: string,
    documentId: string
) {
    try {
        const doc = await storefrontService.getDocumentById(documentId);
        if (!doc) {
            throw new Error('Document not found');
        }

        if (doc.storeId !== storeId) {
            throw new Error('Unauthorized');
        }

        await storefrontService.publishDocument(
            storeId,
            doc.kind as StorefrontDocKind,
            doc.key
        );

        revalidatePath(`/admin/stores/${storeId}/builder/${documentId}`);

        // Fetch store to get slug for revalidation
        const store = await getStoreWithAccount(storeId);
        if (store) {
            // Revalidate the store's layout to update everything
            revalidatePath(`/store/${store.slug}`, 'layout');
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to publish document:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function saveTheme(storeId: string, theme: ThemeVars) {
    try {
        await storefrontService.saveThemeDraft(storeId, theme);
        revalidatePath(`/admin/stores/${storeId}/builder`, 'layout');
        return { success: true };
    } catch (error) {
        console.error('Failed to save theme:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function publishTheme(storeId: string) {
    try {
        await storefrontService.publishTheme(storeId);

        const store = await getStoreWithAccount(storeId);
        if (store) {
            revalidatePath(`/store/${store.slug}`, 'layout');
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to publish theme:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function generateStorefront(storeId: string) {
    try {
        const store = await getStoreWithAccount(storeId);
        if (!store) {
            throw new Error('Store not found');
        }

        // Granular revalidation for "Effective" generation
        // Revalidate Home Page
        revalidatePath(`/store/${store.slug}`, 'page');

        // Revalidate Collection Page
        revalidatePath(`/store/${store.slug}/collection`, 'page');

        // Revalidate Products listing (if different from collection)
        revalidatePath(`/store/${store.slug}/products`, 'page');

        // We do NOT revalidate the layout, preventing full site rebuild/flush

        return { success: true };
    } catch (error) {
        console.error('Failed to generate storefront:', error);
        return { success: false, error: (error as Error).message };
    }
}
