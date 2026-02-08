import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../../_components/StorefrontPage';
import { auth } from '@/lib/auth';
import * as orderService from '@/services/order.service';

interface OrderPageProps {
    params: Promise<{ slug: string; orderId: string }>;
}

export default async function StoreOrderPage({ params }: OrderPageProps) {
    const { slug, orderId } = await params;
    const session = await auth();

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Require authentication
    if (!session?.user) {
        redirect(`/store/${slug}/login?redirect=/store/${slug}/orders/${orderId}`);
    }

    // Fetch order details
    const order = await orderService.getOrder(session.user.id || '', store.id, orderId);

    // Verify order belongs to user
    if (!order || order.userId !== session.user.id) {
        notFound();
    }

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'ORDER_CONFIRMATION') // Try specific confirmation page first
            .then(doc => doc || getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'ORDERS')), // Fallback to general orders page
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Fallback UI if no published page
    if (!page) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto border rounded-lg p-8 shadow-sm">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                            <p className="text-muted-foreground">Thank you for your order. We've received your request.</p>
                        </div>

                        <div className="border-t border-b py-4 my-4">
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Order Number:</span>
                                <span>#{order.id.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Date:</span>
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Status:</span>
                                <span className="capitalize px-2 py-0.5 bg-secondary rounded text-sm">{order.status.toLowerCase()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg mt-4">
                                <span>Total:</span>
                                <span>
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: store.currency || 'USD',
                                    }).format(order.total / 100)}
                                </span>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <a
                                href={`/store/${slug}/collection`}
                                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Continue Shopping
                            </a>
                        </div>
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
            user={{
                id: session.user.id || '',
                email: session.user.email || '',
                name: session.user.name || undefined,
            }}
            pageData={{
                order: {
                    id: order.id,
                    status: order.status,
                    total: order.total,
                    currency: store.currency || 'USD',
                    createdAt: order.createdAt.toISOString(),
                    lines: order.lines.map(line => ({
                        variantId: line.variantId,
                        quantity: line.quantity,
                        price: line.price,
                        productSnapshot: (line.productSnapshot as Record<string, unknown>) || {},
                        variantSnapshot: (line.variantSnapshot as Record<string, unknown>) || {},
                    })),
                },
            }}
        />
    );
}
