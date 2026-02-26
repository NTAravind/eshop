import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument, getSettings, getPublishedPrefabs } from '@/services/storefront.service';
import { getOrCreateCart } from '@/services/cart/cart.service';
import { mapCartToContext } from '@/modules/storefront/mappers/cart';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';
import { auth } from '@/server/auth';
import { cookies } from 'next/headers';
import { listPaymentConfigs } from '@/server/dal/paymentConfig.dal';

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

    // Get session ID for cart merge
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    // Load or merge cart for the user (merge happens if sessionId also provided)
    const cartData = await getOrCreateCart(store.id, {
        userId: session.user.id,
        sessionId: sessionId // Include session ID for cart merge on login
    });

    // Redirect if cart is empty
    if (!cartData || cartData.items.length === 0) {
        redirect(`/store/${slug}/cart`);
    }

    // Map cart to context
    const cart = mapCartToContext(cartData, store.currency || 'USD');

    // Get published documents
    const [layoutDoc, pageDoc, settingsMap, prefabs, paymentConfigs] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'CHECKOUT'),
        getSettings(store.id),
        getPublishedPrefabs(store.id),
        listPaymentConfigs(store.id),
    ]);

    const activePaymentMethods = paymentConfigs
        .filter(c => c.isActive)
        .reduce((acc, config) => {
            acc[config.provider] = true;
            return acc;
        }, {} as Record<string, boolean>);

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
                requirePhoneNumber: false, // Provide default to match StoreContext type
                paymentMethods: activePaymentMethods
            }}
            layout={layout}
            page={page}
            user={session?.user ? {
                id: session.user.id || '',
                email: session.user.email || '',
                name: session.user.name || undefined,
            } : null}
            cart={cart}
            settings={settingsMap || undefined}
            pageData={{ prefabs }}
        />
    );
}
