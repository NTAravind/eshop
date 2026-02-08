import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStoreBySlug } from '@/services/store.service';
import { getPublishedTheme } from '@/services/storefront.service';
import { defaultTheme } from '@/lib/storefront/defaults';
import { StorefrontLayoutClient } from './_components/StorefrontLayoutClient';

interface StoreLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoreLayoutProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getStoreBySlug(slug);

    if (!store) {
        return { title: 'Store Not Found' };
    }

    return {
        title: {
            default: store.name,
            template: `%s | ${store.name}`,
        },
        description: `Welcome to ${store.name}`,
    };
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
    const { slug } = await params;

    const store = await getStoreBySlug(slug);
    if (!store) {
        notFound();
    }

    // Get the published theme or use defaults
    const theme = await getPublishedTheme(store.id);
    const themeVars = (theme?.vars as Record<string, string>) ?? defaultTheme;

    // Build store context for runtime
    const storeContext = {
        id: store.id,
        name: store.name,
        slug: store.slug,
        currency: store.currency || 'USD',
        requirePhoneNumber: store.requirePhoneNumber ?? false,
    };

    return (
        <StorefrontLayoutClient
            store={storeContext}
            themeVars={themeVars}
        >
            {children}
        </StorefrontLayoutClient>
    );
}
