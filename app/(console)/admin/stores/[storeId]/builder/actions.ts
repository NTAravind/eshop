'use server';

import {
    getStoreWithAccount
} from '@/services/store.service';
import * as storefrontService from '@/services/storefront.service';
import type { StorefrontNode, ThemeVars } from '@/types/storefront-builder';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';
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

function createEmptyTree(kind: StorefrontDocKind, key: string): StorefrontNode {
    const baseId = `${kind.toLowerCase()}_${key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const emptyContainer: StorefrontNode = {
        id: baseId,
        type: 'Container',
        props: {},
        children: [
            {
                id: `${baseId}_section`,
                type: 'Section',
                props: {},
                styleOverrides: {
                    base: {
                        padding: '2rem',
                        minHeight: '400px',
                    },
                },
                children: [
                    {
                        id: `${baseId}_heading`,
                        type: 'Heading',
                        props: {
                            level: 1,
                            text: key.replace(/_/g, ' '),
                        },
                        styleOverrides: {
                            base: {
                                marginBottom: '1rem',
                            },
                        },
                    },
                    {
                        id: `${baseId}_text`,
                        type: 'Text',
                        props: {
                            text: 'Start building your content here...',
                        },
                        styleOverrides: {
                            base: {
                                color: 'var(--muted-foreground)',
                            },
                        },
                    },
                ],
            },
        ],
    };

    if (kind === StorefrontDocKind.TEMPLATE) {
        return {
            ...emptyContainer,
            children: [
                {
                    id: `${baseId}_template_wrapper`,
                    type: 'Container',
                    props: {},
                    children: emptyContainer.children,
                },
            ],
        };
    }

    return emptyContainer;
}

export async function createDocument(
    storeId: string,
    kind: StorefrontDocKind,
    key: string
) {
    try {
        // Validate key format
        if (!key || key.trim().length === 0) {
            return { success: false, error: 'Document key is required' };
        }

        // Check for invalid characters
        if (!/^[a-zA-Z0-9_:-]+$/.test(key)) {
            return { success: false, error: 'Key can only contain letters, numbers, underscores, colons, and hyphens' };
        }

        // Check if document already exists
        const existing = await storefrontService.getDocument(storeId, kind, key, StorefrontDocStatus.DRAFT);
        if (existing) {
            return { success: false, error: `A ${kind.toLowerCase()} with key "${key}" already exists` };
        }

        // Create empty tree based on kind
        const tree = createEmptyTree(kind, key);

        // Save as draft
        await storefrontService.saveDraft(storeId, kind, key, tree);

        // Revalidate the builder list page
        revalidatePath(`/admin/stores/${storeId}/builder`);

        return { success: true };
    } catch (error) {
        console.error('Failed to create document:', error);
        return { success: false, error: (error as Error).message };
    }
}
