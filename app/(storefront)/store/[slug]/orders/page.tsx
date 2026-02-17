import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';
import { auth } from '@/lib/auth';
import * as orderService from '@/services/order.service';

interface OrdersPageProps {
    params: Promise<{ slug: string }>;
}

export default async function StoreOrdersPage({ params }: OrdersPageProps) {
    const { slug } = await params;
    const session = await auth();

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Require authentication for orders
    if (!session?.user) {
        redirect(`/store/${slug}/login?redirect=/store/${slug}/orders`);
    }

    // Fetch user orders
    const ordersResult = await orderService.listOrders(
        session.user.id || '',
        store.id,
        { userId: session.user.id || '' }
    );
    const orders = ordersResult.orders || [];

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'ORDERS'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Fallback UI if no published page
    if (!page) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
                    {orders.length === 0 ? (
                        <div className="border rounded-lg p-8 text-center">
                            <p className="text-muted-foreground mb-4">You haven&apos;t placed any orders yet</p>
                            <a
                                href={`/store/${slug}/collection`}
                                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg"
                            >
                                Start Shopping
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: store.currency || 'USD',
                                                }).format(order.total / 100)}
                                            </p>
                                            <span className="text-sm px-2 py-1 bg-secondary rounded">{order.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
            user={{
                id: session.user.id || '',
                email: session.user.email || '',
                name: session.user.name || undefined,
            }}
            pageData={{
                orders: {
                    results: orders.map((o) => ({
                        id: o.id,
                        status: o.status,
                        total: o.total,
                        currency: store.currency || 'USD',
                        createdAt: o.createdAt.toISOString(),
                        lines: [],  // TODO: Include actual order lines when needed
                    })),
                    total: orders.length,
                    page: 1,
                    pageSize: 10,
                },
            }}
        />
    );
}
