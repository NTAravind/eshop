import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';

interface CartPageProps {
    params: Promise<{ slug: string }>;
}

export default async function StoreCartPage({ params }: CartPageProps) {
    const { slug } = await params;

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'CART'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Fallback UI if no published page
    if (!page) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
                    <div className="border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground mb-4">Your cart is empty</p>
                        <a
                            href={`/store/${slug}/collection`}
                            className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg"
                        >
                            Continue Shopping
                        </a>
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
