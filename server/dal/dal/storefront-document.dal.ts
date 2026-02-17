import prisma from '@/lib/prisma';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';

export interface CreateDocumentInput {
    storeId: string;
    kind: StorefrontDocKind;
    key: string;
    status: StorefrontDocStatus;
    tree: unknown;
    meta?: unknown;
}

export interface UpdateDocumentInput {
    tree?: unknown;
    meta?: unknown;
}

/**
 * Get all documents for a store with optional filters
 */
export async function getDocumentsByStore(
    storeId: string,
    kind?: StorefrontDocKind,
    status?: StorefrontDocStatus
) {
    return prisma.storefrontDocument.findMany({
        where: {
            storeId,
            ...(kind && { kind }),
            ...(status && { status }),
        },
        orderBy: [{ kind: 'asc' }, { key: 'asc' }],
    });
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(id: string) {
    return prisma.storefrontDocument.findUnique({
        where: { id },
    });
}

/**
 * Get a document by its unique key combination
 */
export async function getDocumentByKey(
    storeId: string,
    kind: StorefrontDocKind,
    key: string,
    status: StorefrontDocStatus
) {
    return prisma.storefrontDocument.findUnique({
        where: {
            storeId_kind_key_status: {
                storeId,
                kind,
                key,
                status,
            },
        },
    });
}

/**
 * Create a new document
 */
export async function createDocument(data: CreateDocumentInput) {
    return prisma.storefrontDocument.create({
        data: {
            storeId: data.storeId,
            kind: data.kind,
            key: data.key,
            status: data.status,
            tree: data.tree as object,
            meta: data.meta as object | undefined,
        },
    });
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, data: UpdateDocumentInput) {
    return prisma.storefrontDocument.update({
        where: { id },
        data: {
            ...(data.tree !== undefined && { tree: data.tree as object }),
            ...(data.meta !== undefined && { meta: data.meta as object }),
        },
    });
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id: string) {
    return prisma.storefrontDocument.delete({
        where: { id },
    });
}

/**
 * Publish a document - copy DRAFT to PUBLISHED atomically
 */
export async function publishDocument(
    storeId: string,
    kind: StorefrontDocKind,
    key: string
) {
    return prisma.$transaction(async (tx) => {
        // Get the draft document
        const draft = await tx.storefrontDocument.findUnique({
            where: {
                storeId_kind_key_status: {
                    storeId,
                    kind,
                    key,
                    status: StorefrontDocStatus.DRAFT,
                },
            },
        });

        if (!draft) {
            throw new Error(`No draft document found for ${kind}:${key}`);
        }

        // Upsert the published version
        const published = await tx.storefrontDocument.upsert({
            where: {
                storeId_kind_key_status: {
                    storeId,
                    kind,
                    key,
                    status: StorefrontDocStatus.PUBLISHED,
                },
            },
            update: {
                tree: draft.tree as object,
                meta: draft.meta as object | undefined,
            },
            create: {
                storeId,
                kind,
                key,
                status: StorefrontDocStatus.PUBLISHED,
                tree: draft.tree as object,
                meta: draft.meta as object | undefined,
            },
        });

        return published;
    });
}

/**
 * Get all published documents for a store (for runtime rendering)
 */
export async function getPublishedDocuments(storeId: string) {
    return prisma.storefrontDocument.findMany({
        where: {
            storeId,
            status: StorefrontDocStatus.PUBLISHED,
        },
    });
}

/**
 * Get a specific published document by key (for runtime rendering)
 */
export async function getPublishedDocument(
    storeId: string,
    kind: StorefrontDocKind,
    key: string
) {
    return prisma.storefrontDocument.findUnique({
        where: {
            storeId_kind_key_status: {
                storeId,
                kind,
                key,
                status: StorefrontDocStatus.PUBLISHED,
            },
        },
    });
}
