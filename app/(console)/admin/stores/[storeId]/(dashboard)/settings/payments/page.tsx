import { resolveTenant } from "@/lib/tenant/resolveTenant";
import * as paymentConfigDal from "@/dal/paymentConfig.dal";
import { PaymentMethodsClient } from "./components/payment-methods-client";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PaymentSettingsPage({
    params,
}: {
    params: { storeId: string };
}) {
    const { storeId } = await params;

    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        throw new Error("Unauthorized");
    }

    const configs = await paymentConfigDal.listPaymentConfigs(storeId);

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
                            className="justify-start rounded-md p-2 hover:bg-muted block"
                        >
                            General
                        </Link>
                        <Link
                            href={`/admin/stores/${storeId}/settings/payments`}
                            className="justify-start rounded-md bg-muted p-2 hover:bg-muted font-medium block"
                        >
                            Payments
                        </Link>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    <PaymentMethodsClient storeId={storeId} configs={configs} />
                </div>
            </div>
        </div>
    );
}
