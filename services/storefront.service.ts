import prisma from '@/lib/prisma';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';
import * as documentDal from '@/dal/storefront-document.dal';
import * as themeDal from '@/dal/storefront-theme.dal';
import type { ThemeVars } from '@/dal/storefront-theme.dal';
import { defaultGlobalLayout } from '@/lib/storefront/defaults/global-layout';
import { defaultHomePage } from '@/lib/storefront/defaults/home-page';
import { defaultCollectionPage } from '@/lib/storefront/defaults/collection-page';
import { defaultPdpTemplate } from '@/lib/storefront/defaults/pdp-template';
import { defaultCheckoutPage } from '@/lib/storefront/defaults/checkout-page';
import { defaultOrdersPage } from '@/lib/storefront/defaults/orders-page';
import { defaultProfilePage } from '@/lib/storefront/defaults/profile-page';
import { defaultLoginPage } from '@/lib/storefront/defaults/login-page';
import { defaultTheme } from '@/lib/storefront/defaults/theme';
import { productCardPrefab, navbarPrefab, cartSidebarPrefab, orderCardPrefab } from '@/lib/storefront/defaults/prefabs';
import { validateDocument } from '@/lib/storefront/validation';
import type { StorefrontNode } from '@/types/storefront-builder';

// Re-export types
export type { ThemeVars } from '@/dal/storefront-theme.dal';

/**
 * Get a document (draft or published)
 */
export async function getDocument(
    storeId: string,
    kind: StorefrontDocKind,
    key: string,
    status: StorefrontDocStatus
) {
    return documentDal.getDocumentByKey(storeId, kind, key, status);
}

/**
 * Get all documents for a store
 */
export async function listDocuments(
    storeId: string,
    kind?: StorefrontDocKind,
    status?: StorefrontDocStatus
) {
    return documentDal.getDocumentsByStore(storeId, kind, status);
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string) {
    return documentDal.getDocumentById(id);
}

/**
 * Save a draft document
 */
export async function saveDraft(
    storeId: string,
    kind: StorefrontDocKind,
    key: string,
    tree: StorefrontNode,
    meta?: unknown
) {
    // Validate the document tree
    const validation = validateDocument(tree, kind);
    if (!validation.valid) {
        throw new Error(`Invalid document: ${validation.errors.join(', ')}`);
    }

    // Check if draft exists
    const existing = await documentDal.getDocumentByKey(
        storeId,
        kind,
        key,
        StorefrontDocStatus.DRAFT
    );

    if (existing) {
        // Update existing draft
        return documentDal.updateDocument(existing.id, { tree, meta });
    } else {
        // Create new draft
        return documentDal.createDocument({
            storeId,
            kind,
            key,
            status: StorefrontDocStatus.DRAFT,
            tree,
            meta,
        });
    }
}

/**
 * Publish a document
 */
export async function publishDocument(
    storeId: string,
    kind: StorefrontDocKind,
    key: string
) {
    return documentDal.publishDocument(storeId, kind, key);
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string) {
    return documentDal.deleteDocument(id);
}

/**
 * Get published documents for runtime
 */
export async function getPublishedDocuments(storeId: string) {
    return documentDal.getPublishedDocuments(storeId);
}

/**
 * Get a specific published document
 */
export async function getPublishedDocument(
    storeId: string,
    kind: StorefrontDocKind,
    key: string
) {
    return documentDal.getPublishedDocument(storeId, kind, key);
}

// ==================== THEME OPERATIONS ====================

/**
 * Get theme (draft or published)
 */
export async function getTheme(storeId: string, status: StorefrontDocStatus) {
    return themeDal.getTheme(storeId, status);
}

/**
 * Get published theme for runtime
 */
export async function getPublishedTheme(storeId: string) {
    return themeDal.getPublishedTheme(storeId);
}

/**
 * Save draft theme
 */
export async function saveThemeDraft(storeId: string, vars: ThemeVars) {
    return themeDal.createOrUpdateTheme(storeId, StorefrontDocStatus.DRAFT, vars);
}

/**
 * Publish theme
 */
export async function publishTheme(storeId: string) {
    return themeDal.publishTheme(storeId);
}

// ==================== DEFAULT DOCUMENTS ====================


/**
 * Create default storefront documents for a new store
 * Called when a store is created
 */
export async function createDefaultDocuments(storeId: string) {
    const defaultDocs = [
        { kind: StorefrontDocKind.LAYOUT, key: 'GLOBAL_LAYOUT', tree: defaultGlobalLayout },
        { kind: StorefrontDocKind.PAGE, key: 'HOME', tree: defaultHomePage },
        { kind: StorefrontDocKind.PAGE, key: 'COLLECTION', tree: defaultCollectionPage },
        { kind: StorefrontDocKind.PAGE, key: 'CHECKOUT', tree: defaultCheckoutPage },
        { kind: StorefrontDocKind.PAGE, key: 'ORDERS', tree: defaultOrdersPage },
        { kind: StorefrontDocKind.PAGE, key: 'PROFILE', tree: defaultProfilePage },
        { kind: StorefrontDocKind.PAGE, key: 'LOGIN', tree: defaultLoginPage },
        { kind: StorefrontDocKind.TEMPLATE, key: 'PDP:default', tree: defaultPdpTemplate },
        { kind: StorefrontDocKind.PREFAB, key: 'ProductCard', tree: productCardPrefab },
        { kind: StorefrontDocKind.PREFAB, key: 'Navbar', tree: navbarPrefab },
        { kind: StorefrontDocKind.PREFAB, key: 'CartSidebar', tree: cartSidebarPrefab },
        { kind: StorefrontDocKind.PREFAB, key: 'OrderCard', tree: orderCardPrefab },
    ];

    // Create all documents in a transaction
    await prisma.$transaction(async (tx) => {
        for (const doc of defaultDocs) {
            // Create draft
            await tx.storefrontDocument.create({
                data: {
                    storeId,
                    kind: doc.kind,
                    key: doc.key,
                    status: StorefrontDocStatus.DRAFT,
                    tree: doc.tree as object,
                },
            });

            // Create published (same content for initial setup)
            await tx.storefrontDocument.create({
                data: {
                    storeId,
                    kind: doc.kind,
                    key: doc.key,
                    status: StorefrontDocStatus.PUBLISHED,
                    tree: doc.tree as object,
                },
            });
        }

        // Create default theme (draft and published)
        await tx.storefrontTheme.create({
            data: {
                storeId,
                status: StorefrontDocStatus.DRAFT,
                vars: defaultTheme as object,
            },
        });

        await tx.storefrontTheme.create({
            data: {
                storeId,
                status: StorefrontDocStatus.PUBLISHED,
                vars: defaultTheme as object,
            },
        });
    });

    return { success: true };
}

/**
 * Check if a store has storefront documents
 */
export async function hasStorefrontDocuments(storeId: string) {
    const count = await prisma.storefrontDocument.count({
        where: { storeId },
    });
    return count > 0;
}
