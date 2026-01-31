import { notFound } from "next/navigation"
import { getStoreBySlug } from "@/services/store.service"
import { getLayout } from "@/services/layout.service"
import { Renderer } from "@/components/builder/Renderer"
import type { LayoutRoot } from "@/types/builder"

interface StorePageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function StorePage({ params }: StorePageProps) {
    const { slug } = await params

    const store = await getStoreBySlug(slug)
    if (!store) {
        notFound()
    }

    // Fetch published layout for HOME page
    const layoutData = await getLayout(store.id, "HOME", false) // TODO: Switch to true for published only

    if (!layoutData?.tree) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Store Under Construction</h1>
                    <p className="text-muted-foreground">Please check back later.</p>
                </div>
            </div>
        )
    }

    const layoutTree = layoutData.tree as unknown as LayoutRoot["tree"]

    // Runtime context for bindings
    const runtimeContext = {
        store: {
            name: store.name,
            currency: store.currency,
        },
        // Add other contexts like user, cart, etc. as needed
    }

    return (
        <div className="min-h-screen bg-background">
            <Renderer
                node={layoutTree}
                context={{
                    mode: "runtime",
                    runtimeContext
                }}
            />
        </div>
    )
}
