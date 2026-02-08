import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedDocument } from '@/services/storefront.service';
import { StorefrontDocKind } from '@/app/generated/prisma';
import type { StorefrontNode } from '@/types/storefront-builder';
import { StorefrontPage } from '../_components/StorefrontPage';
import { auth } from '@/lib/auth';

interface LoginPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ redirect?: string }>;
}

export default async function StoreLoginPage({ params, searchParams }: LoginPageProps) {
    const { slug } = await params;
    const search = await searchParams;
    const session = await auth();

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // If already logged in, redirect
    if (session?.user) {
        redirect(search.redirect || `/store/${slug}`);
    }

    // Get published documents
    const [layoutDoc, pageDoc] = await Promise.all([
        getPublishedDocument(store.id, StorefrontDocKind.LAYOUT, 'GLOBAL_LAYOUT'),
        getPublishedDocument(store.id, StorefrontDocKind.PAGE, 'LOGIN'),
    ]);

    const layout = layoutDoc?.tree as unknown as StorefrontNode | undefined;
    const page = pageDoc?.tree as unknown as StorefrontNode;

    // Fallback UI if no published page
    if (!page) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-full max-w-md p-8">
                    <h1 className="text-2xl font-bold text-center mb-6">Sign in to {store.name}</h1>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-4 py-2"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full border rounded-lg px-4 py-2"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                        >
                            Sign In
                        </button>
                    </form>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Don&apos;t have an account?{' '}
                        <a href="#" className="text-primary hover:underline">
                            Sign up
                        </a>
                    </p>
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
