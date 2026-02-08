import { notFound, redirect } from 'next/navigation';
import { EditorLayout } from '@/components/builder';
import * as storefrontService from '@/services/storefront.service';
import * as storeService from '@/services/store.service';
import * as productService from '@/services/product.service';
import { saveDocument, publishDocument, saveTheme, publishTheme, generateStorefront } from '../actions';
import type { StorefrontNode, ThemeVars } from '@/types/storefront-builder';
import { StorefrontDocKind, StorefrontDocStatus } from '@/app/generated/prisma';
import { mapProductsToContext } from '@/lib/storefront/mappers/product';

export default async function BuilderEditorPage({
    params,
}: {
    params: Promise<{ storeId: string; documentId: string }>;
}) {
    const { storeId, documentId } = await params;

    const [store, doc, theme, productsResult] = await Promise.all([
        storeService.getStoreWithAccount(storeId),
        storefrontService.getDocumentById(documentId),
        storefrontService.getTheme(storeId, StorefrontDocStatus.DRAFT),
        productService.listProducts(storeId, { take: 20 }),
    ]);

    if (!store) {
        return <div>Store not found</div>;
    }

    if (!doc || doc.storeId !== storeId) {
        notFound();
    }

    // Map products to preview context (type assertion due to DAL field name differences)
    const previewProducts = mapProductsToContext(productsResult.products as any);
    const defaultPreviewProduct = previewProducts[0];

    // Server actions wrappers
    async function handleSave(tree: StorefrontNode, theme: ThemeVars) {
        'use server';
        await Promise.all([
            saveDocument(storeId, documentId, tree),
            saveTheme(storeId, theme)
        ]);
    }

    async function handlePublish(tree: StorefrontNode, theme: ThemeVars) {
        'use server';
        // Save first
        await Promise.all([
            saveDocument(storeId, documentId, tree),
            saveTheme(storeId, theme)
        ]);

        // Then publish
        await Promise.all([
            publishDocument(storeId, documentId),
            publishTheme(storeId)
        ]);
    }

    async function handleGenerate() {
        'use server';
        await generateStorefront(storeId);
    }

    return (
        <EditorLayout
            storeId={storeId}
            documentId={documentId}
            documentKey={doc.key}
            documentKind={doc.kind as 'LAYOUT' | 'PAGE' | 'TEMPLATE' | 'PREFAB'}
            initialTree={doc.tree as unknown as StorefrontNode}
            onSave={handleSave}
            onPublish={handlePublish}
            onGenerate={handleGenerate}
            store={{
                id: store.id,
                name: store.name || 'Store',
                slug: store.slug || '',
                currency: store.currency || 'USD',
            }}
            initialTheme={theme?.vars as ThemeVars}
            previewData={{
                products: previewProducts,
                defaultProduct: defaultPreviewProduct,
            }}
        />
    );
}
