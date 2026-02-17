import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { getCart } from '@/services/cart/cart.service';
import { mapCartToContext } from '@/lib/storefront/mappers/cart';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';
import { auth } from '@/lib/auth';

interface CheckoutPageProps {
    params: Promise<{ slug: string }>;
}

export default async function StoreCheckoutPage({ params }: CheckoutPageProps) {
    const { slug } = await params;
    const session = await auth();

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Enforce login for checkout
    if (!session?.user) {
        redirect(`/store/${slug}/login?redirect=/store/${slug}/checkout`);
    }

    // Load cart for the user
    const cartData = await getCart(store.id, { userId: session.user.id });

    // Redirect if cart is empty
    if (!cartData || cartData.items.length === 0) {
        redirect(`/store/${slug}/cart`);
    }

    // Map cart to context
    const cart = mapCartToContext(cartData);

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'CHECKOUT'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Fallback UI if no published page
    if (!page) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="border rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="w-full border rounded-lg px-4 py-2 mb-4"
                                />
                            </div>
                            <div className="border rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                                <p className="text-muted-foreground">Checkout form coming soon...</p>
                            </div>
                        </div>
                        <div className="border rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            <p className="text-muted-foreground">Your cart is empty</p>
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
            user={session?.user ? {
                id: session.user.id || '',
                email: session.user.email || '',
                name: session.user.name || undefined,
            } : null}
            cart={cart}
        />
    );
}
