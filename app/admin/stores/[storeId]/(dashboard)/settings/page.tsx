import prisma from "@/lib/prisma";
import { SettingsForm } from "./components/settings-form";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default async function SettingsPage({
    params,
}: {
    params: { storeId: string };
}) {
    const { storeId } = await params;

    // Ensure access
    await resolveTenant(storeId);

    const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
            name: true,
            currency: true,
        },
    });

    if (!store) {
        return <div>Store not found</div>;
    }

    return (
        <div className="space-y-6 p-8 pb-16">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your store settings and preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        <Link
                            href={`/admin/stores/${storeId}/settings`}
                            className="justify-start rounded-md bg-muted p-2 hover:bg-muted font-medium block"
                        >
                            General
                        </Link>
                        <Link
                            href={`/admin/stores/${storeId}/settings/payments`}
                            className="justify-start rounded-md p-2 hover:bg-muted block"
                        >
                            Payments
                        </Link>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">General Settings</h3>
                            <p className="text-sm text-muted-foreground">
                                Store details, currency, and other general configurations.
                            </p>
                        </div>
                        <Separator />
                        <SettingsForm storeId={storeId} initialData={store} />
                    </div>
                </div>
            </div>
        </div>
    );
}
