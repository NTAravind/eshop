import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from './_components/StorefrontPage';

interface StoreHomePageProps {
    params: Promise<{ slug: string }>;
}

export default async function StoreHomePage({ params }: StoreHomePageProps) {
    const { slug } = await params;

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'HOME'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Fallback UI if no published page
    if (!page) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-8 max-w-md">
                    <h1 className="text-3xl font-bold mb-4">{store.name}</h1>
                    <p className="text-muted-foreground mb-8">
                        Welcome to our store. We are currently setting up our storefront.
                    </p>
                    <div className="p-4 bg-secondary/50 rounded-lg border">
                        <p className="text-sm font-medium">Store ID: {store.id}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <StorefrontPage
            store={{
                id: store.id,
                name: store.name,
                slug: store.slug,
                currency: store.currency || 'USD',
            }}
            layout={layout}
            page={page}
        />
    );
}
